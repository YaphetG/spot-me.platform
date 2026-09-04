"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

/**
 * Structured campaign deliverables.
 *
 * This is the machine-checkable half of a campaign brief. Everything typed here
 * is verified mechanically against the influencer's post at proof-of-post time
 * (required hashtags, required mentions, platform), which is why it has to be
 * structured rather than buried in the free-text description. The description
 * remains the subjective half, judged by the model.
 */

export const DELIVERABLE_TYPES = ["REEL", "POST", "STORY", "VIDEO"] as const;
export const DELIVERABLE_PLATFORMS = ["ANY", "INSTAGRAM", "TIKTOK"] as const;

export type DeliverableType = (typeof DELIVERABLE_TYPES)[number];
export type DeliverablePlatform = (typeof DELIVERABLE_PLATFORMS)[number];

export type Deliverable = {
    type: DeliverableType;
    platform: DeliverablePlatform;
    count: number;
    hashtags: string[];
    mentions: string[];
};

export function emptyDeliverable(): Deliverable {
    return { type: "POST", platform: "ANY", count: 1, hashtags: [], mentions: [] };
}

/**
 * `#Spot.Me!` -> `spotme`. The backend normalises identically, so what an admin
 * sees here is exactly what will be matched against the caption.
 */
export function normalizeTag(value: string): string {
    return value.trim().toLowerCase().replace(/^[#@]/, "").replace(/[^a-z0-9_]/g, "");
}

function parseTagList(raw: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const part of raw.split(/[,\s]+/)) {
        const tag = normalizeTag(part);
        if (tag && !seen.has(tag)) {
            seen.add(tag);
            out.push(tag);
        }
    }
    return out;
}

type Props = {
    value: Deliverable[];
    onChange: (next: Deliverable[]) => void;
    disabled?: boolean;
};

export function DeliverablesEditor({ value, onChange, disabled }: Props) {
    const update = (index: number, patch: Partial<Deliverable>) => {
        onChange(value.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Label className="text-base">Deliverables</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                        What the influencer must actually post. Hashtags, mentions and
                        platform are checked automatically against their submitted post.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onChange([...value, emptyDeliverable()])}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                </Button>
            </div>

            {value.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No deliverables yet. Without them, nothing about a submitted post can
                    be verified automatically &mdash; only a human could judge it.
                </div>
            ) : (
                <div className="space-y-4">
                    {value.map((d, i) => (
                        <div key={i} className="rounded-lg border p-4 space-y-4 bg-card">
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary">Deliverable {i + 1}</Badge>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`d-type-${i}`}>Type</Label>
                                    <select
                                        id={`d-type-${i}`}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                                        value={d.type}
                                        disabled={disabled}
                                        onChange={(e) =>
                                            update(i, { type: e.target.value as DeliverableType })
                                        }
                                    >
                                        {DELIVERABLE_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`d-platform-${i}`}>Platform</Label>
                                    <select
                                        id={`d-platform-${i}`}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                                        value={d.platform}
                                        disabled={disabled}
                                        onChange={(e) =>
                                            update(i, {
                                                platform: e.target.value as DeliverablePlatform,
                                            })
                                        }
                                    >
                                        {DELIVERABLE_PLATFORMS.map((p) => (
                                            <option key={p} value={p}>
                                                {p === "ANY" ? "Any platform" : p}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`d-count-${i}`}>How many</Label>
                                    <Input
                                        id={`d-count-${i}`}
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={d.count}
                                        disabled={disabled}
                                        onChange={(e) =>
                                            update(i, {
                                                count: Math.max(1, parseInt(e.target.value, 10) || 1),
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`d-hashtags-${i}`}>Required hashtags</Label>
                                    <Input
                                        id={`d-hashtags-${i}`}
                                        placeholder="#spotme, #summersale"
                                        defaultValue={d.hashtags.join(", ")}
                                        disabled={disabled}
                                        onBlur={(e) =>
                                            update(i, { hashtags: parseTagList(e.target.value) })
                                        }
                                    />
                                    {d.hashtags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {d.hashtags.map((h) => (
                                                <Badge key={h} variant="outline">
                                                    #{h}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`d-mentions-${i}`}>Required mentions</Label>
                                    <Input
                                        id={`d-mentions-${i}`}
                                        placeholder="@spotme_official"
                                        defaultValue={d.mentions.join(", ")}
                                        disabled={disabled}
                                        onBlur={(e) =>
                                            update(i, { mentions: parseTagList(e.target.value) })
                                        }
                                    />
                                    {d.mentions.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {d.mentions.map((m) => (
                                                <Badge key={m} variant="outline">
                                                    @{m}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
