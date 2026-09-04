"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Ticket } from "lucide-react"
import Link from "next/link"
import { apiFetch } from "@/lib/api-fetch"

export default function NewCampaignPage() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        budget: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const res = await apiFetch("/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    budget_cents: Math.floor(parseFloat(formData.budget) * 100) || 0
                })
            })

            if (res.ok) {
                router.push("/business/campaigns")
                router.refresh()
            } else {
                alert("Failed to create campaign. Check backend logs.")
            }
        } catch (err) {
            console.error(err)
            alert("Error creating campaign.")
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
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-slate-50/50">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/business/campaigns">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Creating..." : "Create Campaign"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
