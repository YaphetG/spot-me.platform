"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AdminService } from "@/lib/api"
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

const formSchema = z.object({
    handle: z.string().min(2, {
        message: "Handle must be at least 2 characters.",
    }),
    platform: z.enum(["INSTAGRAM", "TIKTOK"]),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    user_id: z.string().uuid({ message: "Invalid UUID format" }),
})

export default function ManualEntryPage() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            handle: "",
            platform: "INSTAGRAM",
            latitude: 0,
            longitude: 0,
            user_id: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await AdminService.postInfluencersManualAdd({
                handle: values.handle,
                platform: values.platform,
                latitude: values.latitude,
                longitude: values.longitude,
                user_id: values.user_id,
            })
            toast.success("Influencer added successfully")
            form.reset()
        } catch (error) {
            console.error(error)
            toast.error("Failed to add influencer")
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

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Latitude</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="any" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="longitude"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Longitude</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="any" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="user_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>User UUID</FormLabel>
                                <FormControl>
                                    <Input placeholder="00000000-0000-0000-0000-000000000000" {...field} />
                                </FormControl>
                                <FormDescription>
                                    UUID of the user to owns this influencer profile.
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
