"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Ticket } from "lucide-react"
import Link from "next/link"
import { apiFetch } from "@/lib/api-fetch"
import { fetchMyBusinesses, type MyBusiness } from "@/lib/businesses"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DeliverablesEditor, emptyDeliverable, type Deliverable } from "@/components/deliverables-editor"

export default function NewCampaignPage() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [deliverables, setDeliverables] = useState<Deliverable[]>([emptyDeliverable()])
    const [error, setError] = useState<string | null>(null)
    const [businesses, setBusinesses] = useState<MyBusiness[] | null>(null)
    const [businessId, setBusinessId] = useState<string>("")

    useEffect(() => {
        fetchMyBusinesses()
            .then(mine => {
                setBusinesses(mine)
                // One business: no choice to make. Several: make the owner pick
                // rather than defaulting to whichever happens to be first.
                if (mine.length === 1) setBusinessId(mine[0].id)
            })
            .catch(err => setError(err instanceof Error ? err.message : "Could not load your businesses."))
    }, [])
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        budget: "",
        fee: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!businessId) {
            setError("Choose which business this campaign is for.")
            return
        }
        const budgetCents = Math.round(parseFloat(formData.budget) * 100) || 0
        const feeCents = Math.round(parseFloat(formData.fee) * 100) || 0
        if (feeCents <= 0) {
            setError("Set the fee each influencer will be paid.")
            return
        }
        if (feeCents > budgetCents) {
            setError("The fee per influencer cannot exceed the total budget.")
            return
        }
        setSubmitting(true)
        setError(null)

        try {
            const res = await apiFetch("/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    business_id: businessId,
                    title: formData.title,
                    description: formData.description,
                    budget_cents: budgetCents,
                    influencer_fee_cents: feeCents,
                    deliverables: deliverables.length > 0 ? deliverables : null
                })
            })

            if (res.ok) {
                router.push("/business/campaigns")
                router.refresh()
            } else {
                // Show what actually went wrong. "Check backend logs" is not
                // something a business owner can act on, and it hid real
                // failures (e.g. an account with no linked business) behind a
                // generic alert.
                let detail = `Request failed with status ${res.status}.`
                try {
                    const body = await res.json()
                    if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail)
                } catch {
                    // response had no JSON body; keep the status-code message
                }
                setError(detail)
            }
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Could not reach the server.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/business/campaigns">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Campaign</h1>
                    <p className="text-slate-500 mt-1">Setup your new influencer marketing campaign.</p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-primary" />
                            Campaign Details
                        </CardTitle>
                        <CardDescription>
                            Provide clear instructions and a budget to attract the best influencers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {businesses && businesses.length > 1 && (
                            <div className="space-y-2">
                                <Label htmlFor="business">Business</Label>
                                <Select value={businessId} onValueChange={setBusinessId}>
                                    <SelectTrigger id="business">
                                        <SelectValue placeholder="Which business is this campaign for?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businesses.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-500">Influencers are matched around this business&apos;s location.</p>
                            </div>
                        )}
                        {businesses && businesses.length === 0 && (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                No business is linked to this account yet, so a campaign cannot be created.
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Campaign Title</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Summer Promo 2026"
                                maxLength={100}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Campaign Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={6}
                                required
                                placeholder="Describe the goal of the campaign, what the influencer should do, any requirements, etc."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="budget">Total Budget ($)</Label>
                            <Input
                                id="budget"
                                name="budget"
                                type="number"
                                min="0"
                                step="any"
                                value={formData.budget}
                                onChange={handleChange}
                                required
                                placeholder="500.00"
                            />
                            <p className="text-xs text-slate-500">The total amount you are willing to spend for this campaign.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fee">Fee per Influencer ($)</Label>
                            <Input
                                id="fee"
                                name="fee"
                                type="number"
                                min="1"
                                step="any"
                                value={formData.fee}
                                onChange={handleChange}
                                required
                                placeholder="50.00"
                            />
                            <p className="text-xs text-slate-500">
                                What each influencer you invite is offered. Your budget covers
                                {(() => {
                                    const b = parseFloat(formData.budget), f = parseFloat(formData.fee)
                                    return b > 0 && f > 0 ? ` ${Math.floor(b / f)} influencer${Math.floor(b / f) === 1 ? "" : "s"} at this fee.` : " as many influencers as it allows at this fee."
                                })()}
                            </p>
                        </div>

                        <div className="border-t pt-6">
                            <DeliverablesEditor
                                value={deliverables}
                                onChange={setDeliverables}
                                disabled={submitting}
                            />
                        </div>

                        {error && (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-slate-50/50">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/business/campaigns">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={submitting || !businessId}>
                            {submitting ? "Creating..." : "Create Campaign"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
