import { apiGet, apiSend } from "@/lib/api-fetch";

/**
 * Admin review of business registration details (issue M26).
 *
 * At its first launch a business owner submits legal name, registration
 * number and country; `BusinessVerificationWorkflow` then waits for an admin
 * decision, the same way `VerificationWorkflow` does for influencers. The
 * reviewer is the signed-in admin, taken from the bearer token server-side.
 */
export type BusinessVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface BusinessVerification {
    id: string;
    owner_user_id: string;
    legal_name: string;
    registration_number: string;
    country: string;
    account_email: string;
    status: BusinessVerificationStatus;
    submitted_at: string;
    reviewed_at?: string | null;
    rejection_reason?: string | null;
}

export function fetchBusinessVerifications(
    status: BusinessVerificationStatus
): Promise<BusinessVerification[]> {
    return apiGet<BusinessVerification[]>(
        `/admin/business-verifications?status=${encodeURIComponent(status)}`
    );
}

export function approveBusinessVerification(id: string): Promise<BusinessVerification> {
    return apiSend<BusinessVerification>(
        `/admin/business-verifications/${encodeURIComponent(id)}/signal`,
        "POST",
        { action: "APPROVE" }
    );
}

export function rejectBusinessVerification(
    id: string,
    reason: string
): Promise<BusinessVerification> {
    return apiSend<BusinessVerification>(
        `/admin/business-verifications/${encodeURIComponent(id)}/signal`,
        "POST",
        { action: "REJECT", reason }
    );
}
