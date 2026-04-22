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
    ADMIN_APPROVED: "outline",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING:        "Pending AI",
    AI_PASSED:      "AI Passed ✓",
    AI_FAILED:      "AI Failed ✗",
    ADMIN_APPROVED: "Approved ✓",
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
            toast.success("Submission approved!");
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
                prev.map((s) => s.id === id ? { ...s, verification_status: "AI_FAILED" } : s)
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
        pending: submissions.filter(s => s.verification_status === "PENDING").length,
        aiPassed: submissions.filter(s => s.verification_status === "AI_PASSED").length,
        aiFailed: submissions.filter(s => s.verification_status === "AI_FAILED").length,
        approved: submissions.filter(s => s.verification_status === "ADMIN_APPROVED").length,
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
                    { label: "Awaiting Review", value: counts.aiPassed, color: "text-amber-500" },
                    { label: "Approved", value: counts.approved, color: "text-green-600" },
                    { label: "Rejected", value: counts.aiFailed, color: "text-red-500" },
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
                                    const canAct = sub.verification_status === "AI_PASSED" || sub.verification_status === "PENDING";
                                    const llmNotes = (sub.scraped_data as Record<string, {llm_notes?: string}>)?.llm?.llm_notes;

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
                                            <TableCell className="px-6 text-sm text-muted-foreground max-w-[200px]">
                                                <span className="truncate block" title={llmNotes ?? "—"}>
                                                    {llmNotes ?? "—"}
                                                </span>
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
