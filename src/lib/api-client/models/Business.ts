/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type Business = {
    id: UUID;
    owner_id: UUID;
    name: string;
    description?: string | null;
    website?: string | null;
    location_point?: {
        type?: Business.type;
        coordinates?: Array<number>;
    };
    service_radius?: {
        type?: Business.type;
        coordinates?: Array<Array<Array<number>>>;
    };
};
export namespace Business {
    export enum type {
        POINT = 'Point',
    }
}

