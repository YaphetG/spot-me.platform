/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InviteStatus } from './InviteStatus';
import type { Timestamp } from './Timestamp';
import type { UUID } from './UUID';
export type CampaignInvite = {
    id: UUID;
    campaign_id: UUID;
    influencer_id: UUID;
    status: InviteStatus;
    quoted_rate_cents?: number | null;
    created_at?: Timestamp;
};

