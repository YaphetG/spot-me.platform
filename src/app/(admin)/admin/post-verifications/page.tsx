"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminService } from "@/lib/api-client";
import type {
    AdminAction,
    ProofOfPostSubmission,
} from "@/lib/api-client/models/ProofOfPostSubmission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Send, Undo2, ExternalLink, Loader2, RefreshCw, FileCheck2 } from "lucide-react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING:           "secondary",
    AI_PASSED:         "default",
    AI_FAILED:         "destructive",
    SCRAPE_FAILED:     "outline",
    AWAITING_BUSINESS: "secondary",
    BUSINESS_APPROVED: "outline",
    BUSINESS_REJECTED: "destructive",
    ADMIN_APPROVED:    "outline",
    ADMIN_REJECTED:    "destructive",
};

// These labels carry the distinction the whole pipeline exists to make. A post
// that failed its checks and a post we could never fetch are different events,
// and an admin sending the second one to a business would be sending nothing.
const STATUS_LABELS: Record<string, string> = {
    PENDING:           "Needs a human",
    AI_PASSED:         "AI passed ✓",
    AI_FAILED:         "Content failed ✗",
    SCRAPE_FAILED:     "Could not fetch post",
    AWAITING_BUSINESS: "With business",
    BUSINESS_APPROVED: "Business approved ✓",
    BUSINESS_REJECTED: "Disputed by business",
    ADMIN_APPROVED:    "Approved ✓",
    ADMIN_REJECTED:    "Rejected by admin",
};

type Tab = "ai" | "disputed";

// "AI no" (M30): a content failure, a failed fetch, or a PENDING submission
// whose verdict came back "needs a human" (e.g. the LLM could not run).
// A PENDING submission with no verdict yet is still being verified.
function isAiCouldNotPass(sub: ProofOfPostSubmission): boolean {
    if (sub.verification_status === "AI_FAILED" || sub.verification_status === "SCRAPE_FAILED") {
        return true;
    }
    return (
        sub.verification_status === "PENDING" &&
        sub.scraped_data?.verdict?.toUpperCase() === "NEEDS_HUMAN"
    );
}

function isDisputed(sub: ProofOfPostSubmission): boolean {
    return sub.verification_status === "BUSINESS_REJECTED";
}

export default function PostVerificationsPage() {
    const [submissions, setSubmissions] = useState<ProofOfPostSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("ai");
    const [notes, setNotes] = useState<Record<string, string>>({});

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await AdminService.getSubmissions();
            setSubmissions(data as unknown as ProofOfPostSubmission[]);
        } catch {
            toast.error("Failed to load submissions.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleAction = async (id: string, action: AdminAction) => {
        const note = (notes[id] ?? "").trim();
        if (action === "RETURN_TO_INFLUENCER" && !note) {
            toast.error("Add a note for the influencer before returning the post.");
            return;
        }
        setActionLoading(id);
        try {
            // POST /submissions/{id}/admin-action
            await AdminService.adminAction(id, { action, note: note || undefined });
            toast.success(
                action === "SEND_TO_BUSINESS"
                    ? "Sent to the business for review."
                    : "Returned to the influencer with your note."
            );
            // Either way the submission leaves the mediation queue.
            setSubmissions((prev) => prev.filter((s) => s.id !== id));
            setNotes((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        } catch {
            toast.error("Failed to update submission.");
        } finally {
            setActionLoading(null);
        }
    };

    const aiQueue = submissions.filter(isAiCouldNotPass);
    const disputedQueue = submissions.filter(isDisputed);
    const visible = tab === "ai" ? aiQueue : disputedQueue;

    const counts = {
        total: submissions.length,
        aiCouldNotPass: aiQueue.length,
        disputed: disputedQueue.length,
        withBusiness: submissions.filter(s => s.verification_status === "AWAITING_BUSINESS").length,
    };

    return (
        <div className="flex flex-col gap-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileCheck2 className="h-7 w-7 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Post Verifications</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Mediate proof-of-post submissions. The business decides; you send a
                            post on to the business or return it to the influencer.
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchSubmissions} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: counts.total, color: "text-foreground" },
                    { label: "AI Could Not Pass", value: counts.aiCouldNotPass, color: "text-amber-500" },
                    { label: "Disputed by Business", value: counts.disputed, color: "text-red-500" },
                    { label: "With Business", value: counts.withBusiness, color: "text-blue-600" },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-6 pb-4">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2" role="tablist">
                {([
                    { key: "ai", label: "AI could not pass", count: counts.aiCouldNotPass },
                    { key: "disputed", label: "Disputed by business", count: counts.disputed },
                ] as const).map((t) => (
                    <Button
                        key={t.key}
                        role="tab"
                        aria-selected={tab === t.key}
                        variant={tab === t.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                        <Badge variant="secondary" className="ml-2">{t.count}</Badge>
                    </Button>
                ))}
            </div>

            {/* Submissions Table */}
            <Card>
                <CardHeader className="border-b py-4">
                    <CardTitle className="text-base">
                        {tab === "ai" ? "AI could not pass" : "Disputed by business"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center p-16">
                            <Loader2 className="animate-spin h-7 w-7 text-primary" />
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-muted-foreground gap-2">
                            <FileCheck2 className="h-10 w-10 opacity-20" />
                            <p>Nothing to mediate here.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6">Invite ID</TableHead>
                                    <TableHead className="px-6">Post URL</TableHead>
                                    <TableHead className="px-6">
                                        {tab === "ai" ? "AI Result" : "Business's Reason"}
                                    </TableHead>
                                    <TableHead className="px-6">Status</TableHead>
                                    <TableHead className="px-6">Submitted</TableHead>
                                    <TableHead className="px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visible.map((sub) => {
                                    const isActing = actionLoading === sub.id;
                                    const note = notes[sub.id] ?? "";
                                    const report = sub.scraped_data ?? undefined;
                                    const failedChecks = report?.deterministic?.failed_checks ?? [];
                                    const llm = report?.llm;

                                    return (
                                        <TableRow key={sub.id}>
                                            <TableCell className="px-6 font-mono text-xs text-muted-foreground align-top">
                                                {sub.invite_id.slice(0, 8)}…
                                            </TableCell>
                                            <TableCell className="px-6 max-w-[200px] align-top">
                                                <a
                                                    href={sub.submitted_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary hover:underline truncate text-sm"
                                                >
                                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{sub.submitted_url}</span>
                                                </a>
                                            </TableCell>
                                            {/* shadcn's TableCell hardcodes whitespace-nowrap, so
                                                the long LLM reasoning could never wrap and ran
                                                across the columns to its right. Override it and
                                                give the content a real width to wrap inside. */}
                                            <TableCell className="px-6 text-sm align-top whitespace-normal">
                                                <div className="flex flex-col gap-1.5 w-[380px] break-words">
                                                    {tab === "disputed" ? (
                                                        // Admin-only: the influencer never sees
                                                        // the business's reason directly.
                                                        sub.business_rejection_reason ? (
                                                            <span>{sub.business_rejection_reason}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">No reason given.</span>
                                                        )
                                                    ) : (
                                                        <>
                                                            {report?.reason && (
                                                                <span className="text-muted-foreground">{report.reason}</span>
                                                            )}

                                                            {failedChecks.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {failedChecks.map((c) => (
                                                                        <Badge key={c} variant="destructive" className="text-[10px]">
                                                                            {c}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {llm && !llm.available && (
                                                                <span className="text-amber-600 text-xs">
                                                                    Subjective review did not run — human judgement required.
                                                                </span>
                                                            )}
                                                            {llm?.available && llm.reasoning && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    AI: {llm.reasoning}
                                                                    {typeof llm.confidence === "number"
                                                                        ? ` (confidence ${(llm.confidence * 100).toFixed(0)}%)`
                                                                        : ""}
                                                                </span>
                                                            )}

                                                            {report?.post?.degraded && (
                                                                <span className="text-amber-600 text-xs font-medium">
                                                                    Synthetic data — not real evidence.
                                                                </span>
                                                            )}

                                                            {!report && (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 align-top">
                                                <Badge variant={STATUS_COLORS[sub.verification_status] ?? "secondary"}>
                                                    {STATUS_LABELS[sub.verification_status] ?? sub.verification_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 text-sm text-muted-foreground align-top">
                                                {sub.created_at
                                                    ? new Date(sub.created_at as string).toLocaleDateString()
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="px-6 align-top whitespace-normal">
                                                <div className="flex flex-col gap-2 w-[260px]">
                                                    <Textarea
                                                        value={note}
                                                        disabled={isActing}
                                                        placeholder="Note (optional to send to business, required to return to influencer)"
                                                        aria-label="Mediation note"
                                                        className="text-xs min-h-14"
                                                        onChange={(e) =>
                                                            setNotes((prev) => ({ ...prev, [sub.id]: e.target.value }))
                                                        }
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            disabled={isActing}
                                                            onClick={() => handleAction(sub.id, "SEND_TO_BUSINESS")}
                                                            className="h-8"
                                                        >
                                                            {isActing ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <><Send className="h-3.5 w-3.5 mr-1" /> Send to business</>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={isActing || !note.trim()}
                                                            title={note.trim() ? undefined : "A note is required"}
                                                            onClick={() => handleAction(sub.id, "RETURN_TO_INFLUENCER")}
                                                            className="h-8"
                                                        >
                                                            <Undo2 className="h-3.5 w-3.5 mr-1" /> Return to influencer
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
