import type { UUID } from './UUID';
import type { Timestamp } from './Timestamp';

export type VerificationSubmissionStatus = 'PENDING' | 'AI_PASSED' | 'AI_FAILED' | 'ADMIN_APPROVED';

export type ProofOfPostSubmission = {
    id: UUID;
    invite_id: UUID;
    submitted_url: string;
    verification_status: VerificationSubmissionStatus;
    scraped_data?: Record<string, unknown> | null;
    created_at?: Timestamp;
    updated_at?: Timestamp;
};
