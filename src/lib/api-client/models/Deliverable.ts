/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One structured, machine-checkable requirement of a campaign brief.
 * Hashtags and mentions are stored normalised (lowercase, no sigil).
 */
export type Deliverable = {
    type: 'REEL' | 'POST' | 'STORY' | 'VIDEO';
    platform?: 'INSTAGRAM' | 'TIKTOK' | 'ANY';
    count?: number;
    hashtags?: Array<string>;
    mentions?: Array<string>;
};
