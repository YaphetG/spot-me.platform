"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Ticket, MapPin, Users, Calendar, RefreshCw, Check, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { apiFetch, apiGet, apiSend } from "@/lib/api-fetch"

type InviteStatus =
    | "INVITED" | "INTERESTED" | "DECLINED" | "NEGOTIATING"
    | "SCHEDULED" | "COMPLETED" | "PASSED"

interface Campaign {
    id: string
    title: string
    description: string | null
    status: string
    budget_cents: number
    target_radius_meters: number | null
    created_at: string
}

interface CampaignInvite {
    id: string
    status: InviteStatus
    quoted_rate_cents: number | null
    created_at: string
    influencer: { id: string; handle: string; platform: string }
}

// What each status means from the business's side of the table.
const STATUS_LABEL: Record<InviteStatus, string> = {
    INVITED: "Awaiting reply",
    INTERESTED: "Interested",
    DECLINED: "Declined",
    NEGOTIATING: "Negotiating",
    SCHEDULED: "Booked",
    COMPLETED: "Completed",
    PASSED: "Passed",
}

export default function CampaignDetailsPage() {
    const params = useParams()
    const campaignId = params.id as string

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [invites, setInvites] = useState<CampaignInvite[]>([])
    const [loading, setLoading] = useState(true)
    const [invitesError, setInvitesError] = useState<string | null>(null)
    // Invite id with a decision in flight, so its buttons can't be double-clicked.
    const [deciding, setDeciding] = useState<string | null>(null)

    const loadInvites = useCallback(async () => {
        try {
            setInvites(await apiGet<CampaignInvite[]>(`/campaigns/${campaignId}/invites`))
            setInvitesError(null)
        } catch (err) {
            // Previously a failed request left the list empty, which reads as
            // "nobody has been invited" rather than "we couldn't load them".
            setInvitesError(err instanceof Error ? err.message : "Could not load invites")
        }
    }, [campaignId])

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
                    const found = allCampaigns.find((c: Campaign) => c.id === campaignId)
                    if (found) {
                        setCampaign(found)
                    } else {
                        // Handle not found
                        console.error("Campaign not found")
                    }
                }

                await loadInvites()
            } catch (err) {
                console.error("Failed to fetch campaign details", err)
            } finally {
                setLoading(false)
            }
        }

        fetchDetails()
    }, [campaignId, loadInvites])


    const handleLaunch = async () => {
        if (!campaignId) return;

        try {
            // Launch with no invites; influencers are invited afterwards. Any
            // invites staged while the campaign was a draft go out now.
            await apiSend(`/campaigns/${campaignId}/launch`, "POST", { influencer_ids: [] })
            setCampaign(c => c && { ...c, status: "ACTIVE" })
            await loadInvites()
            toast.success("Campaign launched. It is now active.")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not launch the campaign.")
        }
    }

    const decide = async (invite: CampaignInvite, decision: "BOOK" | "PASS") => {
        setDeciding(invite.id)
        try {
            await apiSend(`/invites/${invite.id}/signal`, "POST", { decision })
            toast.success(decision === "BOOK"
                ? `Booked @${invite.influencer.handle}.`
                : `Passed on @${invite.influencer.handle}.`)
        } catch (err) {
            // e.g. 503 while the workflow engine is down (nothing changed), or
            // 409 if the offer already expired.
            toast.error(err instanceof Error ? err.message : "Could not record your decision.")
        } finally {
            setDeciding(null)
            await loadInvites()
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
                    <p className="text-slate-500 mt-2 mb-6">The campaign you are looking for does not exist or you don&apos;t have access.</p>
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
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Influencers
                                </CardTitle>
                                <CardDescription>
                                    Book the ones who are interested.
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={loadInvites} aria-label="Refresh invites">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {invitesError ? (
                            <div className="text-center py-6 text-sm">
                                <p className="text-red-600">{invitesError}</p>
                                <Button variant="outline" size="sm" className="mt-3" onClick={loadInvites}>
                                    Try again
                                </Button>
                            </div>
                        ) : invites.length === 0 ? (
                            <div className="text-center py-6 text-sm text-slate-500">
                                No influencers have been invited to this campaign yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {invites.map((invite) => (
                                    <div key={invite.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-slate-900 truncate">@{invite.influencer.handle}</p>
                                                <p className="text-xs text-slate-500 capitalize">
                                                    {invite.influencer.platform.toLowerCase()}
                                                    {invite.quoted_rate_cents != null && ` · $${(invite.quoted_rate_cents / 100).toFixed(2)}`}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={invite.status === "INTERESTED" ? "default" : "outline"}
                                                className="text-[10px] shrink-0"
                                            >
                                                {STATUS_LABEL[invite.status] ?? invite.status}
                                            </Badge>
                                        </div>
                                        {invite.status === "INTERESTED" && (
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1"
                                                    disabled={deciding === invite.id}
                                                    onClick={() => decide(invite, "BOOK")}
                                                >
                                                    <Check className="h-3.5 w-3.5 mr-1" /> Book
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1"
                                                    disabled={deciding === invite.id}
                                                    onClick={() => decide(invite, "PASS")}
                                                >
                                                    <X className="h-3.5 w-3.5 mr-1" /> Pass
                                                </Button>
                                            </div>
                                        )}
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
