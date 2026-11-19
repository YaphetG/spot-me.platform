"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { manualAddInfluencer } from "@/lib/influencer-invites"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { LocationFields } from "@/components/location-fields"
import { coordinatesSchema } from "@/lib/location"

// Home is the postal code's centroid (Q20): precise enough for radius
// matching, without pinning down where the influencer lives (Q21).
const formSchema = coordinatesSchema.extend({
    handle: z.string().min(2, {
        message: "Handle must be at least 2 characters.",
    }),
    platform: z.enum(["INSTAGRAM", "TIKTOK"]),
    email: z.string().email({ message: "Enter the influencer's email address." }),
})

export default function ManualEntryPage() {
    // Remounts the location fields after a successful add, clearing the code.
    const [locationKey, setLocationKey] = useState(0)
    const form = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            handle: "",
            platform: "INSTAGRAM",
            latitude: "",
            longitude: "",
            email: "",
        },
    })

    async function onSubmit(values: z.output<typeof formSchema>) {
        try {
            await manualAddInfluencer(values)
            toast.success(`Invite sent to ${values.email}`)
            form.reset()
            setLocationKey(k => k + 1)
        } catch (error) {
            console.error(error)
            toast.error("Failed to add influencer", {
                description: error instanceof Error ? error.message : undefined,
            })
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg border shadow-sm">
            <h1 className="text-2xl font-bold mb-6">Manual Add Influencer</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="handle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Handle</FormLabel>
                                <FormControl>
                                    <Input placeholder="@username" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Social media handle (e.g. @spot.me)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Platform</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a platform" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                                        <SelectItem value="TIKTOK">TikTok</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-2">
                        <h2 className="text-sm font-medium">Home area</h2>
                        <LocationFields key={locationKey} />
                    </div>

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="creator@example.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                    The influencer gets an email with a link to set their password.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Button type="submit">Create Influencer</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
