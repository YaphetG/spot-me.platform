"use client";

import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LocationValues } from "@/lib/location";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { MapPin } from "lucide-react";

type CoordinateValues = {
    latitude: number;
    longitude: number;
    service_radius_km?: number;
};

/**
 * Latitude/longitude inputs with a Raleigh shortcut, and optionally a service
 * radius. Must be rendered inside a <Form> whose values include these fields.
 */
export function LocationFields({ showRadius = false }: { showRadius?: boolean }) {
    const form = useFormContext<CoordinateValues>();

    const handleUseRaleighCenter = () => {
        form.setValue("latitude", 35.7718);
        form.setValue("longitude", -78.6406);
        toast.info("Using Raleigh Center coordinates");
    };

    return (
        <div className="space-y-4">
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

            {showRadius && (
                <FormField
                    control={form.control}
                    name="service_radius_km"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Service radius (km)</FormLabel>
                            <FormControl>
                                <Input type="number" step="any" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                                How far from this location you want to find influencers.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
}

/**
 * Everything an owner fills in for a new location (see `locationSchema`):
 * name, description, coordinates and service radius.
 */
export function NewLocationFields() {
    const form = useFormContext<LocationValues>();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Location name</FormLabel>
                        <FormControl>
                            <Input placeholder="Acme Coffee, Downtown" {...field} />
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
            <LocationFields showRadius />
        </div>
    );
}
