"use client";

import { useState, useEffect, useCallback } from "react";
import {
    CampaignInvite,
    InviteStatus,
    DefaultService,
    InviteSignalDecision
} from "@/lib/api-client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, CheckCircle, XCircle, Calendar, PlayCircle } from "lucide-react";

interface InviteListProps {
    campaignId: string;
}

export function InviteList({ campaignId }: InviteListProps) {
    const [invites, setInvites] = useState<CampaignInvite[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvites = useCallback(async () => {
        try {
            const data = await DefaultService.getCampaignsInvites(campaignId);
            setInvites(data);
        } catch (error) {
            console.error("Failed to fetch invites", error);
            toast.error("Failed to load invites");
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        fetchInvites();
        const interval = setInterval(fetchInvites, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, [fetchInvites]);

    const handleSignal = async (inviteId: string, decision: InviteSignalDecision) => {
        try {
            toast.info(`Sending signal: ${decision}...`);
            await DefaultService.postInvitesSignal(inviteId, { decision });
            toast.success("Signal sent!");
            // Immediate refresh
            setTimeout(fetchInvites, 500);
        } catch (error) {
            console.error("Signal failed", error);
            toast.error("Failed to send signal");
        }
    };

    const getStatusColor = (status: InviteStatus) => {
        switch (status) {
            case InviteStatus.INVITED: return "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25";
            case InviteStatus.INTERESTED: return "bg-green-500/15 text-green-700 hover:bg-green-500/25";
            case InviteStatus.DECLINED: return "bg-red-500/15 text-red-700 hover:bg-red-500/25";
            case InviteStatus.SCHEDULED: return "bg-purple-500/15 text-purple-700 hover:bg-purple-500/25";
            case InviteStatus.COMPLETED: return "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25";
            default: return "bg-gray-500/15 text-gray-700";
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">The War Room (Invites)</h3>
                <Button variant="outline" size="sm" onClick={fetchInvites}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invite ID</TableHead>
                            <TableHead>Influencer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions (Simulation)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invites.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No invites found. Launch the campaign to start.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invites.map((invite) => (
                                <TableRow key={invite.id}>
                                    <TableCell className="font-mono text-xs">{invite.id.slice(0, 8)}...</TableCell>
                                    <TableCell>{invite.influencer_id.slice(0, 8)}...</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(invite.status)}>
                                            {invite.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {invite.status === InviteStatus.INVITED && (
                                                <>
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        className="border-green-200 hover:bg-green-50 text-green-700"
                                                        onClick={() => handleSignal(invite.id, InviteSignalDecision.INTERESTED)}
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Simulate Interest
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        className="border-red-200 hover:bg-red-50 text-red-700"
                                                        onClick={() => handleSignal(invite.id, InviteSignalDecision.DECLINED)}
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Simulate Decline
                                                    </Button>
                                                </>
                                            )}
                                            {invite.status === InviteStatus.INTERESTED && (
                                                <>
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        className="border-purple-200 hover:bg-purple-50 text-purple-700"
                                                        onClick={() => handleSignal(invite.id, InviteSignalDecision.BOOK)}
                                                    >
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        Book Visit
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        className="border-gray-200 hover:bg-gray-50 text-gray-700"
                                                        onClick={() => handleSignal(invite.id, InviteSignalDecision.DECLINED)}
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Pass
                                                    </Button>
                                                </>
                                            )}
                                            {/* Add Launch endpoint button if we want to simulate per invite? No, launch is campaign level */}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
