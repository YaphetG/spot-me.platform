"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileCheck2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { apiGet } from "@/lib/api-fetch"
import { fetchCampaignSubmissions } from "@/lib/submissions"

/**
 * How many influencer posts are waiting on this business (M30), linking to
 * the first campaign that has one. Renders nothing while loading, on error,
 * or when there is nothing to review: a badge reading "0" is noise.
 */
export function PostsAwaitingBadge() {
    const [awaiting, setAwaiting] = useState<{ count: number; campaignId: string } | null>(null)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const campaigns = await apiGet<{ id: string }[]>("/campaigns")
                const perCampaign = await Promise.all(campaigns.map(async (c) => ({
                    campaignId: c.id,
                    count: (await fetchCampaignSubmissions(c.id))
                        .filter(s => s.verification_status === "AWAITING_BUSINESS").length,
                })))
                const first = perCampaign.find(c => c.count > 0)
                const count = perCampaign.reduce((sum, c) => sum + c.count, 0)
                if (!cancelled && first) setAwaiting({ count, campaignId: first.campaignId })
            } catch (err) {
                console.error("Failed to count posts awaiting review", err)
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    if (!awaiting) return null

    return (
        <Link href={`/business/campaigns/${awaiting.campaignId}`}>
            <Badge className="gap-1.5 px-3 py-1 text-sm">
                <FileCheck2 className="h-4 w-4" />
                {awaiting.count} {awaiting.count === 1 ? "post" : "posts"} to review
            </Badge>
        </Link>
    )
}
