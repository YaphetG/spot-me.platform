import * as z from "zod";
import { DefaultService, type Business } from "@/lib/api-client";
import "@/lib/api-config";

/** Coordinates of a business location, shared by every form that sets one. */
export const coordinatesSchema = z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
});

/** Everything a business owner provides for a location they create. */
export const locationSchema = coordinatesSchema.extend({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    service_radius_km: z.coerce
        .number()
        .positive("Service radius must be greater than 0")
        .max(200, "Service radius can be at most 200 km"),
});

export type LocationValues = z.infer<typeof locationSchema>;

export const locationDefaults: LocationValues = {
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    service_radius_km: 10,
};

const KM_PER_DEGREE_LAT = 111.32;

/**
 * A GeoJSON polygon approximating a circle of `radiusKm` around a point, for
 * `service_radius`. Longitude degrees shrink with latitude, so scale by cos.
 */
export function serviceRadiusPolygon(lat: number, lng: number, radiusKm: number) {
    const steps = 32;
    const dLat = radiusKm / KM_PER_DEGREE_LAT;
    const dLng = radiusKm / (KM_PER_DEGREE_LAT * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
    const ring: [number, number][] = [];
    for (let i = 0; i < steps; i++) {
        const theta = (2 * Math.PI * i) / steps;
        ring.push([lng + dLng * Math.cos(theta), lat + dLat * Math.sin(theta)]);
    }
    ring.push(ring[0]);
    return { type: "Polygon", coordinates: [ring] };
}

/** Create a location (business) owned by the signed-in user. */
export function createLocation(values: LocationValues): Promise<Business> {
    return DefaultService.postBusinesses({
        name: values.name,
        description: values.description || undefined,
        latitude: values.latitude,
        longitude: values.longitude,
        service_radius: serviceRadiusPolygon(
            values.latitude,
            values.longitude,
            values.service_radius_km
        ),
    });
}

/** The API's error detail from a generated-client error, else `fallback`. */
export function apiErrorDetail(error: unknown, fallback: string): string {
    const detail = (error as { body?: { detail?: unknown } } | null)?.body?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const msg = String(detail[0]?.msg ?? "");
        return msg.replace(/^Value error, /, "") || fallback;
    }
    return fallback;
}
