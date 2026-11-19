/**
 * Postal code → point, with Mapbox Geocoding v6 forward search (Q20).
 *
 * People enter a country and a postal code; the form sends the postcode's
 * centroid as `latitude`/`longitude`. Kept free of app imports so the unit
 * test can run it with plain `node --test`.
 */

/** Countries offered in the location forms. ISO 3166-1 alpha-2 codes. */
export const COUNTRIES: readonly { code: string; name: string }[] = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "IE", name: "Ireland" },
    { code: "AU", name: "Australia" },
    { code: "NZ", name: "New Zealand" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "ES", name: "Spain" },
    { code: "IT", name: "Italy" },
    { code: "NL", name: "Netherlands" },
    { code: "MX", name: "Mexico" },
];

export const DEFAULT_COUNTRY = "US";

export function countryName(code: string): string {
    return COUNTRIES.find(c => c.code === code)?.name ?? code;
}

/** A postal code found by the geocoder. */
export interface PostalCodePlace {
    latitude: number;
    longitude: number;
    /** What to show the user, e.g. "27601 · Raleigh, North Carolina". */
    label: string;
}

const GEOCODE_URL = "https://api.mapbox.com/search/geocode/v6/forward";

/** The forward-search URL for one postal code in one country. */
export function postalCodeUrl(postalCode: string, country: string, token: string): string {
    const params = new URLSearchParams({
        q: postalCode.trim(),
        types: "postcode",
        country: country.toLowerCase(),
        limit: "1",
        access_token: token,
    });
    return `${GEOCODE_URL}?${params.toString()}`;
}

type Named = { name?: unknown } | undefined;

interface GeocodeFeature {
    geometry?: { coordinates?: unknown };
    properties?: {
        name?: unknown;
        place_formatted?: unknown;
        coordinates?: { latitude?: unknown; longitude?: unknown };
        context?: { place?: Named; locality?: Named; region?: Named };
    };
}

function str(v: unknown): string | undefined {
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

function num(v: unknown): number | undefined {
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * The first feature of a v6 response as a place, or null when there is none.
 * Prefers `properties.coordinates` and falls back to the geometry.
 */
export function parsePostalCodeResponse(body: unknown, postalCode: string): PostalCodePlace | null {
    const features = (body as { features?: unknown } | null)?.features;
    if (!Array.isArray(features) || features.length === 0) return null;
    const feature = features[0] as GeocodeFeature;
    const props = feature.properties ?? {};

    let latitude = num(props.coordinates?.latitude);
    let longitude = num(props.coordinates?.longitude);
    if (latitude === undefined || longitude === undefined) {
        const coords = feature.geometry?.coordinates;
        if (Array.isArray(coords)) {
            longitude = num(coords[0]);
            latitude = num(coords[1]);
        }
    }
    if (latitude === undefined || longitude === undefined) return null;

    const code = str(props.name) ?? postalCode.trim();
    const ctx = props.context ?? {};
    const parts = [str(ctx.place?.name) ?? str(ctx.locality?.name), str(ctx.region?.name)].filter(
        (p): p is string => p !== undefined
    );
    const where = parts.length > 0 ? parts.join(", ") : str(props.place_formatted);

    return { latitude, longitude, label: where ? `${code} · ${where}` : code };
}

/**
 * Look a postal code up. Resolves to null when Mapbox finds nothing, and
 * throws when the request itself fails (network, bad token, rate limit).
 */
export async function geocodePostalCode(
    postalCode: string,
    country: string,
    token: string,
    fetchImpl: typeof fetch = fetch
): Promise<PostalCodePlace | null> {
    const res = await fetchImpl(postalCodeUrl(postalCode, country, token));
    if (!res.ok) {
        throw new Error(`Postal code lookup failed (${res.status}).`);
    }
    return parsePostalCodeResponse(await res.json(), postalCode);
}
