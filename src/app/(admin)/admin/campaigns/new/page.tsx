"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { DefaultService } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming we have this, or I'll use Input for now or create it
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    budget_dollars: z.coerce.number().min(1, "Budget must be at least $1"),
});

export default function NewCampaignPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const businessId = searchParams.get("business_id");
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            budget_dollars: 100,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!businessId) {
            toast.error("Valid Business context is required to create a campaign.");
            return;
        }

        setIsLoading(true);
        try {
            const campaign = await DefaultService.postCampaigns({
                business_id: businessId,
                title: values.title,
                description: values.description || "",
                budget_cents: values.budget_dollars * 100
            });

            toast.success("Campaign created!");
            router.push(`/admin/campaigns/${campaign.id}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create campaign");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="mb-8">
                <Link href="/admin/businesses" className="text-muted-foreground hover:text-foreground inline-flex items-center mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Businesses
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Create New Campaign</h1>
                <p className="text-muted-foreground mt-2">
                    Define your campaign goals and budget to start matching with influencers.
                </p>
            </div>

            {!businessId ? (
                <div className="p-8 text-center border rounded-lg bg-card mt-8">
                    <h2 className="text-xl font-semibold mb-2 text-destructive">Missing Business Context</h2>
                    <p className="text-muted-foreground mb-4">
                        A campaign must be created under a specific business. Please select a business first.
                    </p>
                    <Link href="/admin/businesses">
                        <Button variant="default">View Businesses</Button>
                    </Link>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Campaign Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Summer Sale 2026" {...field} />
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
                                        <Input placeholder="Brief details about the campaign..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="budget_dollars"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Budget ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="100" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Draft
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
}
