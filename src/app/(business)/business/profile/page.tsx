"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/lib/api-fetch"

export default function BusinessProfilePage() {
    const [business, setBusiness] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        website: ""
    })

    useEffect(() => {
        const fetchBusiness = async () => {
            try {
                const res = await apiFetch("/businesses/me")
                if (res.ok) {
                    const data = await res.json()
                    setBusiness(data)
                    setFormData({
                        name: data.name || "",
                        description: data.description || "",
                        website: data.website || ""
                    })
                }
            } catch (err) {
                console.error("Failed to fetch business", err)
            } finally {
                setLoading(false)
            }
        }
        fetchBusiness()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!business) return

        setSaving(true)
        try {
            const res = await apiFetch(`/businesses/${business.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                alert("Profile updated successfully")
            } else {
                alert("Failed to update profile")
            }
        } catch (err) {
            console.error("Failed to update business", err)
            alert("An error occurred")
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
                            We could not find your business profile. Please make sure the seed script has been run.
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
