/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignStatus } from './CampaignStatus';
import type { UUID } from './UUID';
import type { Deliverable } from './Deliverable';
export type Campaign = {
    id: UUID;
    business_id: UUID;
    title: string;
    description?: string;
    budget_cents?: number;
    target_radius_meters?: number | null;
    deliverables?: Array<Deliverable> | null;
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

