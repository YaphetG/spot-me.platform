/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateInfluencerManualRequest } from '../models/CreateInfluencerManualRequest';
import type { InfluencerRead } from '../models/InfluencerRead';
import type { UUID } from '../models/UUID';
import type { VerificationSignalRequest } from '../models/VerificationSignalRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Manual Add Influencer
     * @param requestBody
     * @returns InfluencerRead Created
     * @throws ApiError
     */
    public static postInfluencersManualAdd(
        requestBody?: CreateInfluencerManualRequest,
    ): CancelablePromise<InfluencerRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/influencers/manual-add',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List influencers (Admin)
     * @returns InfluencerRead List of influencers
     * @throws ApiError
     */
    public static getInfluencers(): CancelablePromise<Array<InfluencerRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/influencers',
        });
    }
    /**
     * Start verification workflow
     * @param id
     * @returns InfluencerRead Verification started
     * @throws ApiError
     */
    public static postInfluencersVerificationStart(
        id: UUID,
    ): CancelablePromise<InfluencerRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/influencers/{id}/verification/start',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Signal verification decision
     * @param id
     * @param requestBody
     * @returns InfluencerRead Signal processed
     * @throws ApiError
     */
    public static postInfluencersVerificationSignal(
        id: UUID,
        requestBody?: VerificationSignalRequest,
    ): CancelablePromise<InfluencerRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/influencers/{id}/verification/signal',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
