"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { LocationFormValues } from "@/lib/location";
import {
    COUNTRIES,
    DEFAULT_COUNTRY,
    countryName,
    geocodePostalCode,
    type PostalCodePlace,
} from "@/lib/geocode";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Loader2, MapPin, Search } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type CoordinateValues = {
    latitude: number | string;
    longitude: number | string;
    service_radius_km?: number;
};

type Lookup =
    | { status: "idle" }
    | { status: "loading"; code: string; country: string }
    | { status: "found"; code: string; country: string; place: PostalCodePlace }
    | { status: "not_found"; code: string; country: string }
    | { status: "error"; code: string; country: string; message: string };

function asNumber(v: unknown): number | null {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

/**
 * Where a location is: a country and a postal code, looked up with Mapbox
 * (Q20) and stored in the form's `latitude`/`longitude` as the postcode's
 * centroid. Optionally a service radius too. Must be rendered inside a
 * <Form> whose values include these fields.
 *
 * Editing: the form's default point is "Current". An empty postal code keeps
 * it (and leaves the fields clean, so a PATCH of dirty fields doesn't resend
 * it, M37); a postal code moves it. Until a typed code is found the point is
 * blank, so the form can't submit.
 *
 * Without NEXT_PUBLIC_MAPBOX_TOKEN (local development only) it falls back to
 * typing coordinates.
 */
export function LocationFields({ showRadius = false }: { showRadius?: boolean }) {
    const form = useFormContext<CoordinateValues>();
    const [country, setCountry] = useState(DEFAULT_COUNTRY);
    const [postalCode, setPostalCode] = useState("");
    const [lookup, setLookup] = useState<Lookup>({ status: "idle" });

    const defaults = form.formState.defaultValues;
    const currentLat = asNumber(defaults?.latitude);
    const currentLng = asNumber(defaults?.longitude);
    const hasCurrent = currentLat !== null && currentLng !== null;

    const pointError = form.formState.errors.latitude ?? form.formState.errors.longitude;

    /** Blank the point (dirty) so the form won't submit until a code is found. */
    const clearPoint = () => {
        const opts = { shouldDirty: true };
        form.setValue("latitude", "", opts);
        form.setValue("longitude", "", opts);
    };

    /** Back to the form's default point: the current one when editing. */
    const restorePoint = () => {
        form.resetField("latitude");
        form.resetField("longitude");
    };

    const onCodeOrCountryChange = (code: string) => {
        setLookup({ status: "idle" });
        if (code.trim() === "") restorePoint();
        else clearPoint();
    };

    const find = async () => {
        const code = postalCode.trim();
        if (!MAPBOX_TOKEN || code === "") return;
        if (
            lookup.status !== "idle" &&
            lookup.code === code &&
            lookup.country === country &&
            lookup.status !== "error"
        ) {
            return; // Already looked up (e.g. blur, then Find).
        }
        setLookup({ status: "loading", code, country });
        try {
            const place = await geocodePostalCode(code, country, MAPBOX_TOKEN);
            if (!place) {
                clearPoint();
                setLookup({ status: "not_found", code, country });
                return;
            }
            const opts = { shouldDirty: true, shouldValidate: true };
            form.setValue("latitude", place.latitude, opts);
            form.setValue("longitude", place.longitude, opts);
            setLookup({ status: "found", code, country, place });
        } catch (error) {
            clearPoint();
            setLookup({
                status: "error",
                code,
                country,
                message: error instanceof Error ? error.message : "Postal code lookup failed.",
            });
        }
    };

    let pointMessage: string | null = null;
    if (lookup.status === "not_found") {
        pointMessage = `We couldn't find that postal code in ${countryName(lookup.country)}.`;
    } else if (lookup.status === "error") {
        pointMessage = `${lookup.message} Try again.`;
    } else if (pointError && lookup.status !== "loading") {
        pointMessage =
            postalCode.trim() === ""
                ? "Enter a postal code."
                : "Press Find to look up this postal code.";
    }

    return (
        <div className="space-y-4">
            {MAPBOX_TOKEN ? (
                <div className="space-y-2">
                    {hasCurrent && (
                        <p className="text-sm text-muted-foreground">
                            Current: {currentLat.toFixed(2)}, {currentLng.toFixed(2)}. Enter a
                            postal code only to move it.
                        </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="location-country">Country</Label>
                            <Select
                                value={country}
                                onValueChange={value => {
                                    setCountry(value);
                                    onCodeOrCountryChange(postalCode);
                                }}
                            >
                                <SelectTrigger id="location-country" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRIES.map(c => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location-postal-code">Postal code</Label>
                            <Input
                                id="location-postal-code"
                                autoComplete="postal-code"
                                placeholder={country === "US" ? "27601" : ""}
                                value={postalCode}
                                aria-invalid={pointMessage ? true : undefined}
                                onChange={e => {
                                    setPostalCode(e.target.value);
                                    onCodeOrCountryChange(e.target.value);
                                }}
                                onBlur={() => void find()}
                                onKeyDown={e => {
                                    // Enter looks the code up instead of submitting.
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        void find();
                                    }
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => void find()}
                            disabled={postalCode.trim() === "" || lookup.status === "loading"}
                        >
                            {lookup.status === "loading" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="mr-2 h-4 w-4" />
                            )}
                            Find
                        </Button>
                    </div>
                    {lookup.status === "found" && (
                        <p className="flex items-center gap-1 text-sm font-medium">
                            <MapPin className="h-3 w-3" />
                            {lookup.place.label}
                        </p>
                    )}
                    {pointMessage && (
                        <p role="alert" className="text-sm font-medium text-destructive">
                            {pointMessage}
                        </p>
                    )}
                </div>
            ) : (
                <CoordinateInputs />
            )}

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
 * Fallback when no Mapbox token is set (local development): type the
 * coordinates, or use the Raleigh shortcut.
 */
function CoordinateInputs() {
    const form = useFormContext<CoordinateValues>();

    const handleUseRaleighCenter = () => {
        // Dirty, so an edit form sends them (it PATCHes dirty fields only).
        const opts = { shouldDirty: true, shouldValidate: true };
        form.setValue("latitude", 35.7718, opts);
        form.setValue("longitude", -78.6406, opts);
        toast.info("Using Raleigh Center coordinates");
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Postal code lookup needs <code>NEXT_PUBLIC_MAPBOX_TOKEN</code>. Enter coordinates
                instead.
            </p>
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
        </div>
    );
}

/**
 * Everything an owner fills in for a new location (see `locationSchema`):
 * name, description, postal code and service radius.
 */
export function NewLocationFields() {
    const form = useFormContext<LocationFormValues>();

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
