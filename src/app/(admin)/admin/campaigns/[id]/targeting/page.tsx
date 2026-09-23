"use client";

// Disable Next.js caching for this page so it always fetches fresh influencers
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import { DefaultService, Campaign, Influencer, VerificationStatus, Business } from "@/lib/api-client";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { Rocket, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/api-fetch";

type EligibleInfluencer = Influencer & { distance_meters?: number };

export default function TargetingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [business, setBusiness] = useState<Business | null>(null);
    const [radiusKm, setRadiusKm] = useState<number>(5);
    const [influencers, setInfluencers] = useState<EligibleInfluencer[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [launching, setLaunching] = useState(false);

    // Initial load
    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const campaigns = await DefaultService.getCampaigns();
                const found = campaigns.find(c => c.id === id);
                if (found) {
                    setCampaign(found);
                    if (found.target_radius_meters) {
                        setRadiusKm(found.target_radius_meters / 1000);
                    }

                    // Fetch businesses to find the parent business
                    const businesses = await DefaultService.getBusinesses();
                    const parentBusiness = businesses.find(b => b.id === found.business_id);
                    if (parentBusiness) {
                        setBusiness(parentBusiness);
                    }

                } else {
                    toast.error("Campaign not found");
                    router.push("/admin/campaigns");
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load campaign data");
            }
        };
        fetchCampaign();
    }, [id, router]);

    // Fetch influencers based on radius
    const fetchEligibleInfluencers = useCallback(async (radius: number) => {
        setLoading(true);
        try {
            const data = await DefaultService.getCampaignsEligibleInfluencers(id, radius * 1000);
            setInfluencers(data);
        } catch (error) {
            console.error("Failed to fetch influencers", error);
            toast.error("Failed to fetch eligible influencers");
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Debounce radius changes
    useEffect(() => {
        if (!campaign) return;
        const handler = setTimeout(() => {
            fetchEligibleInfluencers(radiusKm);
        }, 300);
        return () => clearTimeout(handler);
    }, [radiusKm, campaign, fetchEligibleInfluencers]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const newSet = new Set(selectedIds);
            influencers.forEach(inf => newSet.add(inf.id));
            setSelectedIds(newSet);
        } else {
            const newSet = new Set(selectedIds);
            influencers.forEach(inf => newSet.delete(inf.id));
            setSelectedIds(newSet);
        }
    };

    const handleSelectOne = (influencerId: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(influencerId);
        } else {
            newSet.delete(influencerId);
        }
        setSelectedIds(newSet);
    };

    const handleLaunch = async () => {
        if (selectedIds.size === 0) {
            toast.warning("Select at least one influencer to invite");
            return;
        }

        setLaunching(true);
        try {
            const influencerIds = Array.from(selectedIds);
            // A DRAFT campaign is launched with these invites; an ACTIVE one
            // just gets more. This used to call bulk-invite with a raw fetch:
            // no auth header (401 since the API enforced auth) and, before
            // that, invites that no workflow would ever process.
            const path = campaign?.status === "DRAFT"
                ? `/campaigns/${id}/launch`
                : `/campaigns/${id}/invites/bulk`;
            await apiSend(path, "POST", { influencer_ids: influencerIds });

            toast.success(`Invited ${influencerIds.length} influencer(s)`);
            router.push(`/admin/campaigns/${id}`);
        } catch (error) {
            // apiSend surfaces the API's detail, e.g. the 503 "safe to retry".
            console.error("Invite failed:", error);
            toast.error(error instanceof Error ? error.message : "Could not reach the server.");
        } finally {
            setLaunching(false);
        }
    };


    const allCurrentSelected = influencers.length > 0 && influencers.every(inf => selectedIds.has(inf.id));

    if (!campaign && loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center gap-4">
                <Link href={`/admin/campaigns/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Targeting</h1>
                    <p className="text-muted-foreground mt-1">
                        Campaign: {campaign?.title}
                    </p>
                    {business && business.location_point?.coordinates && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center">
                            📍 Inheriting location from <strong>{business.name}</strong> @ [{business.location_point.coordinates[1].toFixed(4)}, {business.location_point.coordinates[0].toFixed(4)}]
                        </p>
                    )}
                </div>
                <Button size="lg" onClick={handleLaunch} disabled={launching || selectedIds.size === 0}>
                    {launching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                    Invite {selectedIds.size} Selected
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Control Panel */}
                <div className="md:col-span-1 border rounded-xl p-6 flex flex-col gap-6 bg-card h-fit">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Search Radius</h3>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium">{radiusKm} km</span>
                            <span className="text-xs text-muted-foreground">Max 50km</span>
                        </div>
                        <Slider
                            value={[radiusKm]}
                            min={1}
                            max={50}
                            step={1}
                            onValueChange={(val) => setRadiusKm(val[0])}
                        />
                    </div>
                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Total Eligible in Radius</p>
                        <p className="text-3xl font-bold mt-1">
                            {loading ? <Loader2 className="h-6 w-6 animate-spin mt-2" /> : influencers.length}
                        </p>
                    </div>
                </div>

                {/* List Panel */}
                <div className="md:col-span-3 rounded-xl border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={allCurrentSelected}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Handle</TableHead>
                                <TableHead>Platform</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-32">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : influencers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                        No influencers found within {radiusKm} km.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                influencers.map((inf) => (
                                    <TableRow key={inf.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(inf.id)}
                                                onCheckedChange={(checked) => handleSelectOne(inf.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{inf.handle}</TableCell>
                                        <TableCell>{inf.platform}</TableCell>
                                        <TableCell>
                                            {inf.distance_meters !== undefined
                                                ? `${(inf.distance_meters / 1000).toFixed(1)} km`
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={inf.verification_status === VerificationStatus.VERIFIED ? "default" : "secondary"} className={inf.verification_status === "VERIFIED" ? "bg-green-500" : ""}>
                                                {inf.verification_status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
