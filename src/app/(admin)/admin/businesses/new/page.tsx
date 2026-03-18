"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { DefaultService } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    website: z.string().optional(),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
});

export default function NewBusinessPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            website: "",
            latitude: 0,
            longitude: 0,
        },
    });

    const handleUseRaleighCenter = () => {
        form.setValue("latitude", 35.7718);
        form.setValue("longitude", -78.6406);
        toast.info("Using Raleigh Center coordinates");
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const lat = values.latitude;
            const lng = values.longitude;
            const offset = 0.1; // Roughly a 10km bounding box

            const business = await DefaultService.postBusinesses({
                name: values.name,
                description: values.description || undefined,
                website: values.website || undefined,
                latitude: values.latitude,
                longitude: values.longitude,
                service_radius: {
                    type: "Polygon",
                    coordinates: [[
                        [lng - offset, lat - offset],
                        [lng + offset, lat - offset],
                        [lng + offset, lat + offset],
                        [lng - offset, lat + offset],
                        [lng - offset, lat - offset]
                    ]]
                }
            });

            toast.success("Business created!");
            // Just redirect back to dashboard or wherever for now
            router.push(`/admin/dashboard`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create business");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="mb-8">
                <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground inline-flex items-center mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Add New Business</h1>
                <p className="text-muted-foreground mt-2">
                    Create a business profile and set its location.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Business Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acme Corp" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="A brief description..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                    <Input type="url" placeholder="https://example.com" {...field} />
                                </FormControl>
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

                    <Button type="button" variant="secondary" onClick={handleUseRaleighCenter} className="w-full">
                        <MapPin className="mr-2 h-4 w-4" />
                        Use Raleigh Center (35.7718, -78.6406)
                    </Button>

                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Business
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
