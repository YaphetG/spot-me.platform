"use client";

import { useEffect, useState, use } from "react";
import { DefaultService, Campaign, CampaignStatus } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InviteList } from "@/components/campaigns/invite-list";
import { toast } from "sonner";
import { Rocket, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params
    const { id } = use(params);
    const router = useRouter();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCampaign = async () => {
        try {
            // Prototype Hack: Fetch all and find one since getCampaign(id) is missing
            const campaigns = await DefaultService.getCampaigns();
            const found = campaigns.find(c => c.id === id);

            if (found) {
                setCampaign(found);
            } else {
                toast.error("Campaign not found");
                router.push("/admin/campaigns");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load campaign");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaign();
    }, [id]);



    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!campaign) return null;

    return (
        <div className="flex flex-col gap-6 p-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/campaigns">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">{campaign.title}</h1>
                        <Badge variant={campaign.status === CampaignStatus.OUTREACH_SENT ? "default" : "secondary"}>
                            {campaign.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Budget: ${((campaign.budget_cents || 0) / 100).toLocaleString()}
                    </p>
                </div>

                <Button size="lg" asChild>
                    <Link href={`/admin/campaigns/${campaign.id}/targeting`}>
                        <Rocket className="mr-2 h-4 w-4" />
                        Find & Invite Influencers
                    </Link>
                </Button>
            </div>

            {/* War Room */}
            <InviteList campaignId={campaign.id} />
        </div>
    );
}
