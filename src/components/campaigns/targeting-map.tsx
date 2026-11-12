"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Feature, Polygon } from "geojson";

// Only the business pin and the radius are drawn. Influencer pins are out of
// scope: the eligible-influencers response carries no coordinates, and showing
// home locations is an open privacy question.

interface TargetingMapProps {
    token: string;
    center: [number, number]; // [lng, lat], as GeoJSON stores it
    radiusKm: number;
    label?: string;
}

const SOURCE_ID = "targeting-radius";
const EARTH_RADIUS_KM = 6371;

// A geodesic circle as a polygon; Mapbox circle layers are sized in pixels,
// so a real-world radius has to be drawn as a shape.
function circlePolygon([lng, lat]: [number, number], radiusKm: number, steps = 64): Feature<Polygon> {
    const d = radiusKm / EARTH_RADIUS_KM;
    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;
    const ring: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
        const bearing = (2 * Math.PI * i) / steps;
        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing));
        const lng2 = lng1 + Math.atan2(
            Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
            Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
        );
        ring.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
    }
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}

function boundsOf(feature: Feature<Polygon>) {
    const bounds = new mapboxgl.LngLatBounds();
    feature.geometry.coordinates[0].forEach(([x, y]) => bounds.extend([x, y]));
    return bounds;
}

export default function TargetingMap({ token, center, radiusKm, label }: TargetingMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<InstanceType<typeof mapboxgl.Map> | null>(null);
    const markerRef = useRef<InstanceType<typeof mapboxgl.Marker> | null>(null);
    // Latest center and radius, read by the load handler so it never draws a stale circle.
    const [lng, lat] = center;
    const centerRef = useRef<[number, number]>([lng, lat]);
    const radiusRef = useRef(radiusKm);

    // Create the map once per token.
    useEffect(() => {
        if (!containerRef.current) return;
        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: centerRef.current,
            zoom: 11,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => {
            const circle = circlePolygon(centerRef.current, radiusRef.current);
            map.addSource(SOURCE_ID, { type: "geojson", data: circle });
            map.addLayer({
                id: `${SOURCE_ID}-fill`,
                type: "fill",
                source: SOURCE_ID,
                paint: { "fill-color": "#3b82f6", "fill-opacity": 0.15 },
            });
            map.addLayer({
                id: `${SOURCE_ID}-line`,
                type: "line",
                source: SOURCE_ID,
                paint: { "line-color": "#3b82f6", "line-width": 2 },
            });
            map.fitBounds(boundsOf(circle), { padding: 32, duration: 0 });
        });
        mapRef.current = map;
        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, [token]);

    // Business pin.
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        markerRef.current?.remove();
        const marker = new mapboxgl.Marker({ color: "#ef4444" }).setLngLat([lng, lat]);
        if (label) marker.setPopup(new mapboxgl.Popup({ offset: 24 }).setText(label));
        marker.addTo(map);
        markerRef.current = marker;
    }, [lng, lat, label, token]);

    // Radius circle, redrawn as the slider moves.
    useEffect(() => {
        centerRef.current = [lng, lat];
        radiusRef.current = radiusKm;
        const map = mapRef.current;
        // Only setData is needed; a structural type avoids depending on how the
        // mapbox-gl typings name their source classes.
        const source = map?.getSource(SOURCE_ID) as unknown as { setData(data: Feature<Polygon>): unknown } | undefined;
        if (!map || !source) return; // not loaded yet; the load handler draws it
        const circle = circlePolygon([lng, lat], radiusKm);
        source.setData(circle);
        map.fitBounds(boundsOf(circle), { padding: 32, duration: 300 });
    }, [lng, lat, radiusKm]);

    return <div ref={containerRef} className="h-[360px] w-full rounded-xl border overflow-hidden" />;
}
