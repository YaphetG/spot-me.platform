/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
import type { Deliverable } from './Deliverable';
export type CreateCampaignRequest = {
    /**
     * Required when an ADMIN creates a campaign (they own no business of their
     * own). Ignored for business owners, whose campaign always attaches to the
     * business they own.
     */
    business_id?: UUID;
    title: string;
    description?: string;
    budget_cents: number;
    target_radius_meters?: number | null;
    deliverables?: Array<Deliverable> | null;
};

