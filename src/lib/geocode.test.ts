// Run with `npm test` (Node's built-in test runner; Node strips the types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { geocodePostalCode, parsePostalCodeResponse, postalCodeUrl } from "./geocode.ts";

/** Trimmed from a real v6 response for `q=27601&types=postcode&country=us`. */
const RALEIGH = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [-78.6386, 35.7727] },
            properties: {
                feature_type: "postcode",
                name: "27601",
                place_formatted: "Raleigh, North Carolina, United States",
                coordinates: { longitude: -78.6386, latitude: 35.7727 },
                context: {
                    place: { name: "Raleigh" },
                    region: { name: "North Carolina", region_code: "NC" },
                    country: { name: "United States", country_code: "US" },
                },
            },
        },
    ],
};

function mockFetch(status: number, body: unknown) {
    const calls: string[] = [];
    const impl = (async (url: string | URL | Request) => {
        calls.push(String(url));
        return new Response(JSON.stringify(body), { status });
    }) as typeof fetch;
    return { impl, calls };
}

test("builds a postcode-only, single-result query for the country", () => {
    const url = new URL(postalCodeUrl(" 27601 ", "US", "pk.test"));
    assert.equal(url.origin + url.pathname, "https://api.mapbox.com/search/geocode/v6/forward");
    assert.equal(url.searchParams.get("q"), "27601");
    assert.equal(url.searchParams.get("types"), "postcode");
    assert.equal(url.searchParams.get("country"), "us");
    assert.equal(url.searchParams.get("limit"), "1");
    assert.equal(url.searchParams.get("access_token"), "pk.test");
});

test("resolves 27601 to Raleigh and its centroid", async () => {
    const { impl, calls } = mockFetch(200, RALEIGH);
    const place = await geocodePostalCode("27601", "US", "pk.test", impl);
    assert.equal(calls.length, 1);
    assert.deepEqual(place, {
        latitude: 35.7727,
        longitude: -78.6386,
        label: "27601 · Raleigh, North Carolina",
    });
});

test("returns null when nothing is found", async () => {
    const { impl } = mockFetch(200, { type: "FeatureCollection", features: [] });
    assert.equal(await geocodePostalCode("00000", "US", "pk.test", impl), null);
});

test("throws when the request fails", async () => {
    const { impl } = mockFetch(401, { message: "Not Authorized - Invalid Token" });
    await assert.rejects(geocodePostalCode("27601", "US", "bad", impl), /401/);
});

test("falls back to geometry and place_formatted", () => {
    const place = parsePostalCodeResponse(
        {
            features: [
                {
                    geometry: { coordinates: [-0.1276, 51.5072] },
                    properties: { name: "SW1A 1AA", place_formatted: "London, United Kingdom" },
                },
            ],
        },
        "sw1a 1aa"
    );
    assert.deepEqual(place, {
        latitude: 51.5072,
        longitude: -0.1276,
        label: "SW1A 1AA · London, United Kingdom",
    });
});

test("ignores a feature without coordinates", () => {
    assert.equal(parsePostalCodeResponse({ features: [{ properties: { name: "1" } }] }, "1"), null);
});
