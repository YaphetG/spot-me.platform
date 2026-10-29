"use client";

import { useCallback, useEffect, useState } from "react";
import {
    approveBusinessVerification,
    BusinessVerification,
    BusinessVerificationStatus,
    fetchBusinessVerifications,
    rejectBusinessVerification,
} from "@/lib/business-verifications";
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
import { BadgeCheck, CheckCircle, Loader2, RefreshCw, XCircle } from "lucide-react";

const STATUSES: BusinessVerificationStatus[] = ["PENDING", "VERIFIED", "REJECTED"];

const STATUS_LABELS: Record<BusinessVerificationStatus, string> = {
    PENDING:  "Pending",
    VERIFIED: "Verified",
    REJECTED: "Rejected",
};

const STATUS_COLORS: Record<BusinessVerificationStatus, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING:  "secondary",
    VERIFIED: "default",
    REJECTED: "destructive",
};

function errorMessage(err: unknown, fallback: string): string {
    return err instanceof Error && err.message ? err.message : fallback;
}

export default function BusinessVerificationsPage() {
    const [status, setStatus] = useState<BusinessVerificationStatus>("PENDING");
    const [items, setItems] = useState<BusinessVerification[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    // The row whose reject form is open, and the reason typed into it.
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [reason, setReason] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setItems(await fetchBusinessVerifications(status));
        } catch (err) {
            toast.error(errorMessage(err, "Failed to load business verifications."));
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        load();
    }, [load]);

    // A decided submission no longer belongs in the list being viewed.
    const removeItem = (id: string) => setItems((prev) => prev.filter((v) => v.id !== id));

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await approveBusinessVerification(id);
            toast.success("Business verified — it can now launch campaigns.");
            removeItem(id);
        } catch (err) {
            toast.error(errorMessage(err, "Failed to approve verification."));
        } finally {
            setActionLoading(null);
        }
    };

    const openReject = (id: string) => {
        setRejectingId(id);
        setReason("");
    };

    const handleReject = async (id: string) => {
        const trimmed = reason.trim();
        if (!trimmed) {
            toast.error("A reason is required to reject.");
            return;
        }
        setActionLoading(id);
        try {
            await rejectBusinessVerification(id, trimmed);
            toast.success("Verification rejected.");
            setRejectingId(null);
            setReason("");
            removeItem(id);
        } catch (err) {
            toast.error(errorMessage(err, "Failed to reject verification."));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BadgeCheck className="h-7 w-7 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Business Verifications</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Review registration details before a business can launch campaigns
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="flex gap-2">
                {STATUSES.map((s) => (
                    <Button
                        key={s}
                        size="sm"
                        variant={s === status ? "default" : "outline"}
                        onClick={() => setStatus(s)}
                    >
                        {STATUS_LABELS[s]}
                    </Button>
                ))}
            </div>

            <Card>
                <CardHeader className="border-b py-4">
                    <CardTitle className="text-base">{STATUS_LABELS[status]} submissions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center p-16">
                            <Loader2 className="animate-spin h-7 w-7 text-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-muted-foreground gap-2">
                            <BadgeCheck className="h-10 w-10 opacity-20" />
                            <p>No {STATUS_LABELS[status].toLowerCase()} submissions.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6">Legal name</TableHead>
                                    <TableHead className="px-6">Registration no.</TableHead>
                                    <TableHead className="px-6">Country</TableHead>
                                    <TableHead className="px-6">Account email</TableHead>
                                    <TableHead className="px-6">Submitted</TableHead>
                                    <TableHead className="px-6">Status</TableHead>
                                    <TableHead className="text-right px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((v) => {
                                    const isActing = actionLoading === v.id;
                                    const isRejecting = rejectingId === v.id;

                                    return (
                                        <TableRow key={v.id}>
                                            <TableCell className="px-6 font-medium">{v.legal_name}</TableCell>
                                            <TableCell className="px-6 font-mono text-sm">{v.registration_number}</TableCell>
                                            <TableCell className="px-6">{v.country}</TableCell>
                                            <TableCell className="px-6 text-sm">{v.account_email}</TableCell>
                                            <TableCell className="px-6 text-sm text-muted-foreground">
                                                {v.submitted_at ? new Date(v.submitted_at).toLocaleDateString() : "—"}
                                            </TableCell>
                                            <TableCell className="px-6 whitespace-normal">
                                                <div className="flex flex-col gap-1 max-w-[260px]">
                                                    <Badge variant={STATUS_COLORS[v.status] ?? "secondary"} className="w-fit">
                                                        {STATUS_LABELS[v.status] ?? v.status}
                                                    </Badge>
                                                    {v.status === "REJECTED" && v.rejection_reason && (
                                                        <span className="text-xs text-muted-foreground break-words">
                                                            {v.rejection_reason}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6 align-top whitespace-normal">
                                                {v.status !== "PENDING" ? (
                                                    <span className="text-xs text-muted-foreground">No action</span>
                                                ) : isRejecting ? (
                                                    <div className="flex flex-col items-end gap-2 w-[280px] ml-auto">
                                                        <Textarea
                                                            autoFocus
                                                            placeholder="Reason (shown to the business)"
                                                            value={reason}
                                                            onChange={(e) => setReason(e.target.value)}
                                                            disabled={isActing}
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8"
                                                                disabled={isActing}
                                                                onClick={() => setRejectingId(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-8"
                                                                disabled={isActing || !reason.trim()}
                                                                onClick={() => handleReject(v.id)}
                                                            >
                                                                {isActing ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    "Confirm reject"
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            disabled={isActing}
                                                            onClick={() => handleApprove(v.id)}
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
                                                            onClick={() => openReject(v.id)}
                                                            className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
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
