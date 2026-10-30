import { OpenAPI } from "@/lib/api-client/core/OpenAPI";
import type { InfluencerRead } from "@/lib/api-client";
import { apiSend, toError } from "@/lib/api-fetch";
import "@/lib/api-config";

/**
 * Admin manual-add by email, and the influencer's set-password link (M28).
 *
 * The admin enters the influencer's real email instead of a user UUID; the
 * backend creates the account and emails a single-use link to
 * `/set-password?token=...`, where the influencer picks their own password.
 */
export interface ManualAddInfluencerRequest {
    handle: string;
    platform: "INSTAGRAM" | "TIKTOK";
    latitude: number;
    longitude: number;
    email: string;
}

export function manualAddInfluencer(
    body: ManualAddInfluencerRequest
): Promise<InfluencerRead> {
    return apiSend<InfluencerRead>("/influencers/manual-add", "POST", body);
}

export function resendInfluencerInvite(id: string): Promise<unknown> {
    return apiSend<unknown>(
        `/influencers/${encodeURIComponent(id)}/resend-invite`,
        "POST"
    );
}

/** Why a set-password attempt failed, so the page can say what to do next. */
export class SetPasswordError extends Error {
    readonly tokenInvalid: boolean;

    constructor(message: string, tokenInvalid: boolean) {
        super(message);
        this.tokenInvalid = tokenInvalid;
    }
}

/**
 * Set the password for an invited account. Public: the token is the only
 * credential, so no Authorization header is sent even if one is stored.
 */
export async function setPassword(token: string, password: string): Promise<void> {
    const res = await fetch(`${OpenAPI.BASE}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
    });
    if (res.ok) return;
    const error = await toError(res);
    // 422 is a password the API rejected; anything else in 4xx means the
    // link itself is no good (expired, already used, or unknown).
    const tokenInvalid = res.status >= 400 && res.status < 500 && res.status !== 422;
    throw new SetPasswordError(error.message, tokenInvalid);
}
