"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { NewLocationFields } from "@/components/location-fields"
import { apiSend } from "@/lib/api-fetch"
import { fetchMyBusinesses, type MyBusiness } from "@/lib/businesses"
import {
    apiErrorDetail,
    createLocation,
    locationDefaults,
    locationSchema,
    type LocationValues,
} from "@/lib/location"
import { Loader2, MapPin, Pencil, Plus } from "lucide-react"

/** Form values for an existing location, falling back to the sign-up defaults. */
function toValues(b: MyBusiness): LocationValues {
    return {
        name: b.name,
        description: b.description ?? "",
        latitude: b.latitude ?? locationDefaults.latitude,
        longitude: b.longitude ?? locationDefaults.longitude,
        service_radius_km:
            b.service_radius_meters != null
                ? b.service_radius_meters / 1000
                : locationDefaults.service_radius_km,
    }
}

function LocationForm({
    defaultValues,
    submitLabel,
    onSubmit,
    onCancel,
}: {
    defaultValues: LocationValues
    submitLabel: string
    onSubmit: (values: LocationValues) => Promise<void>
    onCancel: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<LocationValues>({
        resolver: zodResolver(locationSchema),
        defaultValues,
    })

    async function handleSubmit(values: LocationValues) {
        setIsLoading(true)
        try {
            await onSubmit(values)
        } catch (error) {
            // POST goes through the generated client (ApiError with a body),
            // PATCH through apiSend (a plain Error with the detail).
            form.setError("root", {
                message: apiErrorDetail(
                    error,
                    error instanceof Error ? error.message : "Could not save the location."
                ),
            })
        } finally {
            setIsLoading(false)
        }
    }

    const rootError = form.formState.errors.root?.message

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <NewLocationFields />

                {rootError && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                        {rootError}
                    </p>
                )}

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default function BusinessLocationsPage() {
    const [locations, setLocations] = useState<MyBusiness[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLocations(await fetchMyBusinesses())
            } catch (err) {
                setLoadError(err instanceof Error ? err.message : "Could not load your locations.")
            } finally {
                setLoading(false)
            }
        }
        fetchLocations()
    }, [reloadKey])

    const handleCreate = async (values: LocationValues) => {
        await createLocation(values)
        toast.success(`Added ${values.name}.`)
        setAdding(false)
        setReloadKey(k => k + 1)
    }

    const handleUpdate = async (id: string, values: LocationValues) => {
        const updated = await apiSend<MyBusiness>(`/businesses/${id}`, "PATCH", {
            name: values.name,
            description: values.description ?? "",
            latitude: values.latitude,
            longitude: values.longitude,
            service_radius_meters: Math.round(values.service_radius_km * 1000),
        })
        setLocations(prev => prev.map(b => (b.id === updated.id ? { ...b, ...updated } : b)))
        toast.success(`Saved ${updated.name}.`)
        setEditingId(null)
    }

    if (loading) {
        return (
            <div className="w-full max-w-3xl mx-auto space-y-4">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-[160px] w-full" />
                <Skeleton className="h-[160px] w-full" />
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="w-full max-w-3xl mx-auto">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-800">Could not load locations</CardTitle>
                        <CardDescription className="text-red-600">{loadError}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Locations</h1>
                    <p className="text-slate-500 mt-2">
                        Where your business is, and how far from each location to find influencers.
                    </p>
                </div>
                {!adding && (
                    <Button
                        className="gap-2"
                        onClick={() => {
                            setEditingId(null)
                            setAdding(true)
                        }}
                    >
                        <Plus className="h-4 w-4" />
                        Add location
                    </Button>
                )}
            </div>

            {adding && (
                <Card>
                    <CardHeader>
                        <CardTitle>New location</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LocationForm
                            defaultValues={locationDefaults}
                            submitLabel="Add location"
                            onSubmit={handleCreate}
                            onCancel={() => setAdding(false)}
                        />
                    </CardContent>
                </Card>
            )}

            {locations.length === 0 && !adding ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
                    <MapPin className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No locations yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1">
                        Add your first location so you can create campaigns and find influencers nearby.
                    </p>
                </Card>
            ) : (
                locations.map(b => (
                    <Card key={b.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <CardTitle>{b.name}</CardTitle>
                                    <CardDescription className="mt-2">
                                        {b.description || "No description provided."}
                                    </CardDescription>
                                </div>
                                {editingId !== b.id && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => {
                                            setAdding(false)
                                            setEditingId(b.id)
                                        }}
                                    >
                                        <Pencil className="h-3 w-3" />
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {editingId === b.id ? (
                                <LocationForm
                                    defaultValues={toValues(b)}
                                    submitLabel="Save changes"
                                    onSubmit={values => handleUpdate(b.id, values)}
                                    onCancel={() => setEditingId(null)}
                                />
                            ) : (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-slate-500">Position</span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <MapPin className="h-3 w-3" />
                                            {b.latitude != null && b.longitude != null
                                                ? `${b.latitude.toFixed(4)}, ${b.longitude.toFixed(4)}`
                                                : "Not shown"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-500">Service radius</span>
                                        <span className="font-medium">
                                            {b.service_radius_meters != null
                                                ? `${(b.service_radius_meters / 1000).toFixed(1)} km`
                                                : "Not shown"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    )
}
