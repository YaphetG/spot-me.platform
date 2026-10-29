"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, ExternalLink, FileCheck2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { apiSend } from "@/lib/api-fetch"
import {
    fetchCampaignSubmissions,
    type BusinessSubmission,
    type BusinessSubmissionStatus,
} from "@/lib/submissions"

// Statuses that are a decision already taken, and how the business should read
// them. A rejected post is not over: it sits with an admin, who either sends it
// back here or returns it to the influencer.
const PAST_LABEL: Partial<Record<BusinessSubmissionStatus, string>> = {
    BUSINESS_APPROVED: "Approved",
    ADMIN_APPROVED: "Approved",
    BUSINESS_REJECTED: "With admin",
    ADMIN_REJECTED: "Rejected",
}

type Pending = { id: string; kind: "approve" | "reject" }

export function PostsToReview({
    campaignId,
    handles,
    onDecided,
}: {
    campaignId: string
    /** Influencer handle per invite id, from the campaign's invites. */
    handles: Record<string, string>
    /** Approving completes the invite, so the parent's invite list goes stale. */
    onDecided?: () => void
}) {
    const [submissions, setSubmissions] = useState<BusinessSubmission[]>([])
    const [error, setError] = useState<string | null>(null)
    // The post whose Approve or Reject step is open, so only one is at a time.
    const [pending, setPending] = useState<Pending | null>(null)
    const [reason, setReason] = useState("")
    const [sending, setSending] = useState(false)

    const load = useCallback(async () => {
        try {
            setSubmissions(await fetchCampaignSubmissions(campaignId))
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load posts")
        }
    }, [campaignId])

    useEffect(() => {
        load()
    }, [load])

    const handleOf = (sub: BusinessSubmission) => handles[sub.invite_id] ?? "influencer"

    const open = (id: string, kind: Pending["kind"]) => {
        setPending({ id, kind })
        setReason("")
    }

    const submitDecision = async (sub: BusinessSubmission) => {
        if (!pending) return
        const approve = pending.kind === "approve"
        const trimmed = reason.trim()
        if (!approve && !trimmed) return

        setSending(true)
        try {
            await apiSend(`/submissions/${sub.id}/business-decision`, "POST", approve
                ? { decision: "APPROVE" }
                : { decision: "REJECT", reason: trimmed })
            toast.success(approve
                ? `Approved. @${handleOf(sub)} is marked for payment.`
                : "Rejected. Our team will follow up with the influencer.")
            setPending(null)
            onDecided?.()
        } catch (err) {
            // e.g. 409 if an admin already moved the post on.
            toast.error(err instanceof Error ? err.message : "Could not record your decision.")
        } finally {
            setSending(false)
            await load()
        }
    }

    const awaiting = submissions.filter(s => s.verification_status === "AWAITING_BUSINESS")
    const past = submissions.filter(s => PAST_LABEL[s.verification_status])

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileCheck2 className="h-5 w-5 text-primary" />
                            Posts to review
                            {awaiting.length > 0 && (
                                <Badge className="text-xs">{awaiting.length}</Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            These posts passed our automated checks. Approve them to mark the influencer for payment.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh posts">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {error ? (
                    <div className="text-center py-6 text-sm">
                        <p className="text-red-600">{error}</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={load}>
                            Try again
                        </Button>
                    </div>
                ) : awaiting.length === 0 ? (
                    <div className="text-center py-6 text-sm text-slate-500">
                        No posts are waiting for your review.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {awaiting.map((sub) => {
                            const step = pending?.id === sub.id ? pending.kind : null
                            return (
                                <div key={sub.id} className="border border-slate-200 rounded-md p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-slate-900">@{handleOf(sub)}</p>
                                            <a
                                                href={sub.submitted_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-primary hover:underline text-sm min-w-0"
                                            >
                                                <ExternalLink className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{sub.submitted_url}</span>
                                            </a>
                                        </div>
                                        {sub.created_at && (
                                            <span className="text-xs text-slate-500 shrink-0">
                                                {new Date(sub.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    <CheckSummary sub={sub} />

                                    {sub.admin_note && (
                                        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
                                            <span className="font-medium">Note from our team:</span> {sub.admin_note}
                                        </div>
                                    )}

                                    {step === "approve" ? (
                                        <div className="rounded-md bg-slate-50 border border-slate-200 p-3 space-y-3">
                                            <p className="text-sm text-slate-700">
                                                Approve this post? @{handleOf(sub)} will be marked for payment and the booking completed.
                                            </p>
                                            <div className="flex gap-2">
                                                <Button size="sm" disabled={sending} onClick={() => submitDecision(sub)}>
                                                    <Check className="h-3.5 w-3.5 mr-1" /> Yes, approve
                                                </Button>
                                                <Button size="sm" variant="outline" disabled={sending} onClick={() => setPending(null)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : step === "reject" ? (
                                        <div className="rounded-md bg-slate-50 border border-slate-200 p-3 space-y-3">
                                            <label htmlFor={`reason-${sub.id}`} className="text-sm font-medium text-slate-700">
                                                Why are you rejecting this post?
                                            </label>
                                            <Textarea
                                                id={`reason-${sub.id}`}
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="e.g. The post doesn't mention our name."
                                            />
                                            <p className="text-xs text-slate-500">
                                                Our team reviews this before anything is passed on to the influencer.
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={sending || !reason.trim()}
                                                    onClick={() => submitDecision(sub)}
                                                >
                                                    <X className="h-3.5 w-3.5 mr-1" /> Reject post
                                                </Button>
                                                <Button size="sm" variant="outline" disabled={sending} onClick={() => setPending(null)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => open(sub.id, "approve")}>
                                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => open(sub.id, "reject")}>
                                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {past.length > 0 && (
                    <details className="border-t border-slate-100 pt-4">
                        <summary className="cursor-pointer text-sm font-medium text-slate-600">
                            Past decisions ({past.length})
                        </summary>
                        <div className="mt-3 space-y-2">
                            {past.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between gap-3 text-sm">
                                    <div className="min-w-0">
                                        <span className="font-medium text-slate-900">@{handleOf(sub)}</span>{" "}
                                        <a
                                            href={sub.submitted_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            View post
                                        </a>
                                    </div>
                                    <Badge
                                        variant={PAST_LABEL[sub.verification_status] === "Approved" ? "default" : "outline"}
                                        className="text-[10px] shrink-0"
                                    >
                                        {PAST_LABEL[sub.verification_status]}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </CardContent>
        </Card>
    )
}

/** What the automated review found, in the business's terms. */
function CheckSummary({ sub }: { sub: BusinessSubmission }) {
    const report = sub.scraped_data ?? undefined
    if (!report) return null

    const checks = report.deterministic?.checks ?? []
    const llm = report.llm

    return (
        <div className="text-sm space-y-1.5 break-words">
            {report.reason && <p className="text-slate-600">{report.reason}</p>}
            {checks.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {checks.map((c) => (
                        <Badge
                            key={c.check}
                            variant={c.passed ? "secondary" : "destructive"}
                            className="text-[10px]"
                            title={c.detail}
                        >
                            {c.passed ? "✓" : "✗"} {c.check}
                        </Badge>
                    ))}
                </div>
            )}
            {llm?.available && llm.reasoning && (
                <p className="text-xs text-slate-500">
                    AI: {llm.reasoning}
                    {typeof llm.confidence === "number"
                        ? ` (confidence ${(llm.confidence * 100).toFixed(0)}%)`
                        : ""}
                </p>
            )}
            {report.post?.degraded && (
                <p className="text-amber-600 text-xs font-medium">
                    Synthetic data. This is not real evidence of the post.
                </p>
            )}
        </div>
    )
}
