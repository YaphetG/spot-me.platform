/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
import type { VerificationStatus } from './VerificationStatus';
export type Influencer = {
    id: UUID;
    user_id: UUID;
    handle: string;
    platform: string;
    verification_status?: VerificationStatus;
    home_centroid?: {
        type?: Influencer.type;
        coordinates?: Array<number>;
    };
};
export namespace Influencer {
    export enum type {
        POINT = 'Point',
    }
}

