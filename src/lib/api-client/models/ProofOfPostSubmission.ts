import type { UUID } from './UUID';
import type { Timestamp } from './Timestamp';

export type VerificationSubmissionStatus =
    | 'PENDING'
    | 'AI_PASSED'
    /** The post was fetched and genuinely did not meet the brief. */
    | 'AI_FAILED'
    /** We could not retrieve the post at all. Our failure, not the influencer's. */
    | 'SCRAPE_FAILED'
    | 'ADMIN_APPROVED'
    /** A human said no - distinct from a machine verdict. */
    | 'ADMIN_REJECTED';

/** One mechanical check and its outcome, as recorded in `scraped_data`. */
export type VerificationCheck = {
    check: string;
    passed: boolean;
    detail: string;
};

/**
 * The verification record written into `scraped_data` by VerifyPostWorkflow.
 * Everything the admin queue needs in order to explain a verdict.
 */
export type VerificationReport = {
    verdict?: string;
    reason?: string;
    error?: string;
    deterministic?: {
        passed?: boolean;
        failed_checks?: string[];
        checks?: VerificationCheck[];
    };
    llm?: {
        available?: boolean;
        passed?: boolean | null;
        confidence?: number | null;
        reasoning?: string | null;
        model?: string;
        error?: string | null;
    };
    post?: {
        provider?: string;
        platform?: string;
        degraded?: boolean;
        degraded_reason?: string | null;
        caption?: string;
        hashtags?: string[];
        mentions?: string[];
        author_handle?: string | null;
    };
};

export type ProofOfPostSubmission = {
    id: UUID;
    invite_id: UUID;
    submitted_url: string;
    verification_status: VerificationSubmissionStatus;
    scraped_data?: VerificationReport | null;
    created_at?: Timestamp;
    updated_at?: Timestamp;
};
