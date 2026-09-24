"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Ticket, Plus, MapPin } from "lucide-react"
import Link from "next/link"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { apiGet } from "@/lib/api-fetch"
import { fetchMyBusinesses, type MyBusiness } from "@/lib/businesses"

interface Campaign {
    id: string
    business_id: string
    title: string
    description: string | null
    status: string
    budget_cents: number
    influencer_fee_cents: number | null
    target_radius_meters: number | null
    created_at: string
}

const ALL = "all"

export default function BusinessCampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [businesses, setBusinesses] = useState<MyBusiness[]>([])
    const [filter, setFilter] = useState<string>(ALL)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                // GET /campaigns is already scoped to the caller's businesses -
                // all of them. This used to filter to the single business
                // /businesses/me happened to return, hiding the rest.
                const [camps, mine] = await Promise.all([
                    apiGet<Campaign[]>("/campaigns"),
                    fetchMyBusinesses(),
                ])
                setCampaigns(camps)
                setBusinesses(mine)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load campaigns")
            } finally {
                setLoading(false)
            }
        }
        fetchCampaigns()
    }, [])

    const businessName = (id: string) => businesses.find(b => b.id === id)?.name
    const visible = filter === ALL ? campaigns : campaigns.filter(c => c.business_id === filter)

    if (loading) {
        return (
            <div className="w-full max-w-6xl mx-auto space-y-4">
                <Skeleton className="h-10 w-[250px]" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-[200px]" />
                    <Skeleton className="h-[200px]" />
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Campaigns</h1>
                    <p className="text-slate-500 mt-2">Manage your promotional campaigns and matched influencers.</p>
                </div>
                <div className="flex items-center gap-3">
                    {businesses.length > 1 && (
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-[220px]" aria-label="Filter by business">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>All businesses</SelectItem>
                                {businesses.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button asChild className="gap-2 bg-primary">
                        <Link href="/business/campaigns/new">
                            <Plus className="h-4 w-4" />
                            New Campaign
                        </Link>
                    </Button>
                </div>
            </div>

            {error ? (
                <Card className="p-8 text-center border-red-200 bg-red-50 text-red-700">{error}</Card>
            ) : visible.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
                    <Ticket className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No campaigns yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
                        You haven&apos;t created any campaigns{filter !== ALL ? " for this business" : ""}. Launch a new campaign to find and connect with influencers.
                    </p>
                    <Button asChild>
                        <Link href="/business/campaigns/new">Create Campaign</Link>
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {visible.map((camp) => (
                        <Card key={camp.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="line-clamp-1">{camp.title}</CardTitle>
                                    <Badge variant={camp.status === "ACTIVE" ? "default" : "secondary"}>
                                        {camp.status}
                                    </Badge>
                                </div>
                                {businesses.length > 1 && (
                                    <p className="text-xs font-medium text-primary mt-1">{businessName(camp.business_id)}</p>
                                )}
                                <CardDescription className="line-clamp-2 mt-2">
                                    {camp.description || "No description provided."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-slate-500">Budget</span>
                                        <span className="font-medium">${(camp.budget_cents / 100).toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-500">Fee / influencer</span>
                                        <span className="font-medium">
                                            {camp.influencer_fee_cents != null ? `$${(camp.influencer_fee_cents / 100).toFixed(2)}` : "Not set"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-500">Radius</span>
                                        <div className="flex items-center gap-1 font-medium">
                                            <MapPin className="h-3 w-3" />
                                            {camp.target_radius_meters ? `${(camp.target_radius_meters / 1000).toFixed(1)} km` : "Default"}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50 pt-4 flex justify-between">
                                <span className="text-xs text-slate-500">
                                    Created {new Date(camp.created_at).toLocaleDateString()}
                                </span>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/business/campaigns/${camp.id}`}>View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
