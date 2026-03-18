/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type CreateCampaignRequest = {
    business_id: UUID;
    title: string;
    description?: string;
    budget_cents: number;
    target_radius_meters?: number | null;
};

