"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminService } from "@/lib/api-client";
import { ProofOfPostSubmission } from "@/lib/api-client/models/ProofOfPostSubmission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, XCircle, ExternalLink, Loader2, RefreshCw, FileCheck2 } from "lucide-react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING:        "secondary",
    AI_PASSED:      "default",
    AI_FAILED:      "destructive",
    SCRAPE_FAILED:  "outline",
    ADMIN_APPROVED: "outline",
    ADMIN_REJECTED: "destructive",
};

// These labels carry the distinction the whole pipeline exists to make. A post
// that failed its checks and a post we could never fetch are different events,
// and an admin approving the second one would be approving nothing at all.
const STATUS_LABELS: Record<string, string> = {
    PENDING:        "Needs review",
    AI_PASSED:      "AI passed ✓",
    AI_FAILED:      "Content failed ✗",
    SCRAPE_FAILED:  "Could not fetch post",
    ADMIN_APPROVED: "Approved ✓",
    ADMIN_REJECTED: "Rejected by admin",
};

export default function PostVerificationsPage() {
    const [submissions, setSubmissions] = useState<ProofOfPostSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await AdminService.approveSubmission(id);
            toast.success("Approved — the invite is now marked COMPLETED.");
            setSubmissions((prev) =>
                prev.map((s) => s.id === id ? { ...s, verification_status: "ADMIN_APPROVED" } : s)
            );
        } catch {
            toast.error("Failed to approve submission.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        try {
            await AdminService.rejectSubmission(id);
            toast.error("Submission rejected.");
            setSubmissions((prev) =>
                prev.map((s) => s.id === id ? { ...s, verification_status: "ADMIN_REJECTED" } : s)
            );
        } catch {
            toast.error("Failed to reject submission.");
        } finally {
            setActionLoading(null);
        }
    };

    // Stats
    const counts = {
        total: submissions.length,
        // Anything a human still has to decide: machine-passed, still pending,
        // or blocked because we could not fetch the post at all.
        needsReview: submissions.filter(s =>
            s.verification_status === "AI_PASSED" ||
            s.verification_status === "PENDING" ||
            s.verification_status === "SCRAPE_FAILED"
        ).length,
        approved: submissions.filter(s => s.verification_status === "ADMIN_APPROVED").length,
        failed: submissions.filter(s =>
            s.verification_status === "AI_FAILED" || s.verification_status === "ADMIN_REJECTED"
        ).length,
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
                            Review influencer campaign post submissions
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
                    { label: "Needs Review", value: counts.needsReview, color: "text-amber-500" },
                    { label: "Approved", value: counts.approved, color: "text-green-600" },
                    { label: "Failed / Rejected", value: counts.failed, color: "text-red-500" },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-6 pb-4">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Submissions Table */}
            <Card>
                <CardHeader className="border-b py-4">
                    <CardTitle className="text-base">Submission Queue</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center p-16">
                            <Loader2 className="animate-spin h-7 w-7 text-primary" />
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-muted-foreground gap-2">
                            <FileCheck2 className="h-10 w-10 opacity-20" />
                            <p>No submissions found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6">Invite ID</TableHead>
                                    <TableHead className="px-6">Post URL</TableHead>
                                    <TableHead className="px-6">AI Result</TableHead>
                                    <TableHead className="px-6">Status</TableHead>
                                    <TableHead className="px-6">Submitted</TableHead>
                                    <TableHead className="text-right px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.map((sub) => {
                                    const isActing = actionLoading === sub.id;
                                    const canAct =
                                        sub.verification_status === "AI_PASSED" ||
                                        sub.verification_status === "PENDING" ||
                                        sub.verification_status === "AI_FAILED";
                                    const report = sub.scraped_data ?? undefined;
                                    const failedChecks = report?.deterministic?.failed_checks ?? [];
                                    const llm = report?.llm;

                                    return (
                                        <TableRow key={sub.id}>
                                            <TableCell className="px-6 font-mono text-xs text-muted-foreground">
                                                {sub.invite_id.slice(0, 8)}…
                                            </TableCell>
                                            <TableCell className="px-6 max-w-[200px]">
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
                                            {/* Why, not just what. The old queue showed one
                                                opaque note, so an admin approving a submission
                                                had no idea what had actually been checked. */}
                                            <TableCell className="px-6 text-sm max-w-[320px]">
                                                <div className="flex flex-col gap-1.5">
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
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6">
                                                <Badge variant={STATUS_COLORS[sub.verification_status] ?? "secondary"}>
                                                    {STATUS_LABELS[sub.verification_status] ?? sub.verification_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 text-sm text-muted-foreground">
                                                {sub.created_at
                                                    ? new Date(sub.created_at as string).toLocaleDateString()
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {sub.verification_status === "ADMIN_APPROVED" ? (
                                                        <span className="text-xs text-green-600 font-medium">Approved</span>
                                                    ) : canAct ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                disabled={isActing}
                                                                onClick={() => handleApprove(sub.id)}
                                                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                                                            >
                                                                {isActing ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve</>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isActing}
                                                                onClick={() => handleReject(sub.id)}
                                                                className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No action</span>
                                                    )}
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
