"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Ticket, MapPin, Users, Calendar } from "lucide-react"
import Link from "next/link"
import { apiFetch } from "@/lib/api-fetch"

export default function CampaignDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const campaignId = params.id as string

    const [campaign, setCampaign] = useState<any>(null)
    const [invites, setInvites] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!campaignId) return

        const fetchDetails = async () => {
            try {
                // Fetch the campaign details (assuming we have an endpoint, or we filter from all for now)
                // For a robust app, you'd add a GET /api/v1/campaigns/{id} endpoint.
                // Since we only have GET /api/v1/campaigns, we'll fetch all and filter.
                const res = await apiFetch(`/campaigns`)
                if (res.ok) {
                    const allCampaigns = await res.json()
                    const found = allCampaigns.find((c: any) => c.id === campaignId)
                    if (found) {
                        setCampaign(found)
                    } else {
                        // Handle not found
                        console.error("Campaign not found")
                    }
                }

                // Fetch invites for this campaign
                const invitesRes = await apiFetch(`/campaigns/${campaignId}/invites`)
                if (invitesRes.ok) {
                    const invitesData = await invitesRes.json()
                    setInvites(invitesData)
                }

            } catch (err) {
                console.error("Failed to fetch campaign details", err)
            } finally {
                setLoading(false)
            }
        }

        fetchDetails()
    }, [campaignId])


    const handleLaunch = async () => {
        if (!campaignId) return;

        try {
            // Launch the campaign directly without auto-inviting influencers
            const res = await apiFetch(`/campaigns/${campaignId}/launch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ influencer_ids: [] })
            });

            if (res.ok) {
                // Refresh data
                const updatedCampaign = { ...campaign, status: "ACTIVE" };
                setCampaign(updatedCampaign);

                const invitesRes = await apiFetch(`/campaigns/${campaignId}/invites`);
                if (invitesRes.ok) {
                    const invitesData = await invitesRes.json();
                    setInvites(invitesData);
                }

                alert("Campaign launched successfully! It is now ACTIVE.");
            } else {
                alert("Failed to launch campaign.");
            }
        } catch (err) {
            console.error("Failed to launch campaign", err);
            alert("Error launching campaign.");
        }
    }


    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-[250px] w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="w-full justify-center flex p-12">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900">Campaign Not Found</h2>
                    <p className="text-slate-500 mt-2 mb-6">The campaign you are looking for does not exist or you don't have access.</p>
                    <Button asChild>
                        <Link href="/business/campaigns">Back to Campaigns</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/business/campaigns">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{campaign.title}</h1>
                        <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                            {campaign.status}
                        </Badge>
                    </div>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                </div>

                {campaign.status === "DRAFT" && (
                    <div className="ml-auto">
                        <Button className="bg-primary" onClick={handleLaunch}>Launch Campaign</Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details */}
                <Card className="md:col-span-2 shrink-0 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-primary" />
                            Campaign Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 mb-1">Description</h3>
                            <p className="text-slate-900 whitespace-pre-wrap">
                                {campaign.description || "No description provided."}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">Budget</h3>
                                <p className="text-2xl font-semibold text-slate-900">
                                    ${(campaign.budget_cents / 100).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">Target Radius</h3>
                                <p className="text-lg font-medium text-slate-900 flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-slate-400" />
                                    {campaign.target_radius_meters ? `${(campaign.target_radius_meters / 1000).toFixed(1)} km` : "Default (5km)"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Influencers Sidebar */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Influencers
                        </CardTitle>
                        <CardDescription>
                            People invited to this campaign.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invites.length === 0 ? (
                            <div className="text-center py-6 text-sm text-slate-500">
                                No influencers have been invited to this campaign yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {invites.map((invite: any) => (
                                    <div key={invite.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm text-slate-900">Influencer {invite.influencer_id.substring(0, 6)}</p>
                                            <p className="text-xs text-slate-500">{new Date(invite.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] capitalize">
                                            {invite.status.toLowerCase()}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
