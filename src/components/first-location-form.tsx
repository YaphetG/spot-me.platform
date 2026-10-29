"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { NewLocationFields } from "@/components/location-fields";
import {
    apiErrorDetail,
    createLocation,
    locationDefaults,
    locationSchema,
    type LocationValues,
} from "@/lib/location";
import { Loader2 } from "lucide-react";

/**
 * Create the signed-in owner's first location. Shown when an account has no
 * business yet, e.g. when sign-up created the account but not the location.
 */
export function FirstLocationForm({ onCreated }: { onCreated: () => void }) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LocationValues>({
        resolver: zodResolver(locationSchema),
        defaultValues: locationDefaults,
    });

    async function onSubmit(values: LocationValues) {
        setIsLoading(true);
        try {
            await createLocation(values);
            toast.success("Location saved.");
            onCreated();
        } catch (error) {
            form.setError("root", {
                message: apiErrorDetail(error, "Could not save the location."),
            });
        } finally {
            setIsLoading(false);
        }
    }

    const rootError = form.formState.errors.root?.message;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <NewLocationFields />

                {rootError && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                        {rootError}
                    </p>
                )}

                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save location
                </Button>
            </form>
        </Form>
    );
}
