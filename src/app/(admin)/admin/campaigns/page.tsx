"use client";

import { useEffect, useState } from "react";
import { DefaultService, Campaign, CampaignStatus, Business } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Loader2, Building2 } from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export default function CampaignsListPage() {
    const [campaignsByBusiness, setCampaignsByBusiness] = useState<Record<string, { business: Business | undefined, campaigns: Campaign[] }>>({});
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [campaignsData, businessesData] = await Promise.all([
                DefaultService.getCampaigns(),
                DefaultService.getBusinesses()
            ]);

            // Group campaigns by business
            const grouped: Record<string, { business: Business | undefined, campaigns: Campaign[] }> = {};

            campaignsData.forEach(campaign => {
                const bId = campaign.business_id;
                // Defensive check to handle campaigns without a business_id if that occurs
                const key = bId || "unknown";
                if (!grouped[key]) {
                    grouped[key] = {
                        business: bId ? businessesData.find(b => b.id === bId) : undefined,
                        campaigns: []
                    };
                }
                grouped[key].campaigns.push(campaign);
            });

            setCampaignsByBusiness(grouped);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load campaigns and businesses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                <Link href="/admin/campaigns/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin h-6 w-6 text-primary" />
                </div>
            ) : Object.keys(campaignsByBusiness).length === 0 ? (
                <div className="text-center p-12 border rounded-xl bg-card flex items-center justify-center">
                    <p className="text-muted-foreground">No campaigns found.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(campaignsByBusiness).map(([bId, group]) => (
                        <Card key={bId} className="overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b py-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-slate-400" />
                                    {group.business ? group.business.name : "Unknown Business"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-1/3 px-6 h-10">Title</TableHead>
                                            <TableHead className="px-6 h-10">Status</TableHead>
                                            <TableHead className="px-6 h-10">Budget</TableHead>
                                            <TableHead className="text-right px-6 h-10">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.campaigns.map((campaign) => (
                                            <TableRow key={campaign.id}>
                                                <TableCell className="font-medium px-6">{campaign.title}</TableCell>
                                                <TableCell className="px-6">
                                                    <Badge variant={campaign.status === CampaignStatus.OUTREACH_SENT ? "default" : "secondary"}>
                                                        {campaign.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    ${((campaign.budget_cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <Link href={`/admin/campaigns/${campaign.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            Manage
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
