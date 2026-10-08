"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { apiSend } from "@/lib/api-fetch"
import { fetchMyBusinesses, type MyBusiness } from "@/lib/businesses"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function BusinessProfilePage() {
    const [businesses, setBusinesses] = useState<MyBusiness[]>([])
    const [business, setBusiness] = useState<MyBusiness | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        website: ""
    })

    useEffect(() => {
        const fetchBusiness = async () => {
            try {
                // An owner may run several businesses; this used to show only
                // the one /businesses/me picked arbitrarily.
                const mine = await fetchMyBusinesses()
                setBusinesses(mine)
                if (mine.length > 0) selectBusiness(mine[0])
            } catch (err) {
                setLoadError(err instanceof Error ? err.message : "Could not load your businesses.")
            } finally {
                setLoading(false)
            }
        }
        fetchBusiness()
    }, [])

    const selectBusiness = (b: MyBusiness) => {
        setBusiness(b)
        setFormData({
            name: b.name || "",
            description: b.description || "",
            website: b.website || ""
        })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!business) return

        setSaving(true)
        try {
            const updated = await apiSend<MyBusiness>(`/businesses/${business.id}`, "PATCH", formData)
            setBusinesses(prev => prev.map(b => (b.id === updated.id ? updated : b)))
            setBusiness(updated)
            toast.success(`Saved ${updated.name}.`)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save the profile.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-4">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    if (!business) {
        return (
            <div className="w-full max-w-2xl mx-auto">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-800">No Business Found</CardTitle>
                        <CardDescription className="text-red-600">
                            {loadError ?? "No business is linked to this account yet."}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Business Profile</h1>
                <p className="text-slate-500 mt-2">Update your public-facing business details.</p>
            </div>

            {businesses.length > 1 && (
                <div className="space-y-2">
                    <Label htmlFor="business-select">Business</Label>
                    <Select
                        value={business.id}
                        onValueChange={id => {
                            const next = businesses.find(b => b.id === id)
                            if (next) selectBusiness(next)
                        }}
                    >
                        <SelectTrigger id="business-select" className="w-full sm:w-[320px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {businesses.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                        You manage {businesses.length} businesses. Changes apply only to the one selected.
                    </p>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>
                        This information will be displayed to influencers when you invite them to campaigns.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Business Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website URL</Label>
                            <Input
                                id="website"
                                name="website"
                                type="url"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Tell influencers about your business..."
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t pt-6 bg-slate-50/50">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
