import { apiFetch, apiSend } from "@/lib/api-fetch";

/**
 * Business verification (issue M26).
 *
 * Launching a campaign is gated on the owner account being VERIFIED. At the
 * first launch the business submits its registration details, an admin
 * reviews them, and launch returns 409 `business_not_verified` until then.
 * Verification is per owner account and covers all of its locations.
 */
export type BusinessVerificationStatus =
    | "UNVERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED";

export interface BusinessVerification {
    status: BusinessVerificationStatus;
    rejection_reason?: string | null;
}

export interface RegistrationDetails {
    legal_name: string;
    registration_number: string;
    country: string;
}

export const BUSINESS_NOT_VERIFIED = "business_not_verified";

export async function fetchBusinessVerification(): Promise<BusinessVerification> {
    const res = await apiFetch("/businesses/verification");
    // Nothing submitted yet.
    if (res.status === 404) return { status: "UNVERIFIED" };
    if (!res.ok) throw new Error(`Could not load verification status (${res.status})`);
    return (await res.json()) as BusinessVerification;
}

export function submitRegistrationDetails(
    details: RegistrationDetails
): Promise<BusinessVerification> {
    return apiSend<BusinessVerification>("/businesses/verification", "POST", details);
}

/**
 * Whether a response is the launch gate's 409. The detail may be the bare
 * code or an object carrying it, so accept either.
 */
export async function isBusinessNotVerified(res: Response): Promise<boolean> {
    if (res.status !== 409) return false;
    try {
        const body = await res.clone().json();
        const detail = body?.detail;
        return detail === BUSINESS_NOT_VERIFIED || detail?.code === BUSINESS_NOT_VERIFIED;
    } catch {
        return false;
    }
}
