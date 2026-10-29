import { apiGet } from "@/lib/api-fetch";
import type { VerificationReport } from "@/lib/api-client/models/ProofOfPostSubmission";

/**
 * Proof-of-post as the business sees it (M30).
 *
 * An AI-passed post now waits for the business (`AWAITING_BUSINESS`) instead of
 * an admin. The business approves it (`BUSINESS_APPROVED`: invite completed,
 * payout pending) or rejects it (`BUSINESS_REJECTED`), which hands it to an
 * admin to mediate. `AI_PASSED` and `ADMIN_APPROVED` are legacy.
 */
export type BusinessSubmissionStatus =
    | "PENDING"
    | "AWAITING_BUSINESS"
    | "BUSINESS_APPROVED"
    | "BUSINESS_REJECTED"
    | "AI_PASSED"
    | "AI_FAILED"
    | "SCRAPE_FAILED"
    | "ADMIN_APPROVED"
    | "ADMIN_REJECTED";

export interface BusinessSubmission {
    id: string;
    invite_id: string;
    submitted_url: string;
    verification_status: BusinessSubmissionStatus;
    scraped_data?: VerificationReport | null;
    /** Set when an admin sent a post (back) to the business with a note. */
    admin_note?: string | null;
    created_at?: string;
    updated_at?: string;
}

export function fetchCampaignSubmissions(campaignId: string): Promise<BusinessSubmission[]> {
    return apiGet<BusinessSubmission[]>(`/campaigns/${campaignId}/submissions`);
}
