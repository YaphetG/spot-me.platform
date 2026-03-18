/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignStatus } from './CampaignStatus';
import type { UUID } from './UUID';
export type Campaign = {
    id: UUID;
    business_id: UUID;
    title: string;
    description?: string;
    budget_cents?: number;
    target_radius_meters?: number | null;
    location_point?: {
        type?: Campaign.type;
        coordinates?: Array<number>;
    } | null;
    status: CampaignStatus;
};
export namespace Campaign {
    export enum type {
        POINT = 'Point',
    }
}

