/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Business } from '../models/Business';
import type { Campaign } from '../models/Campaign';
import type { CampaignInvite } from '../models/CampaignInvite';
import type { CreateBusinessRequest } from '../models/CreateBusinessRequest';
import type { CreateCampaignRequest } from '../models/CreateCampaignRequest';
import type { CreateUserRequest } from '../models/CreateUserRequest';
import type { Influencer } from '../models/Influencer';
import type { InviteSignalRequest } from '../models/InviteSignalRequest';
import type { User } from '../models/User';
import type { UUID } from '../models/UUID';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Login to get access token
     * @param formData
     * @returns any Successful Login
     * @throws ApiError
     */
    public static postAuthToken(
        formData?: {
            username?: string;
            password?: string;
        },
    ): CancelablePromise<{
        access_token?: string;
        token_type?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/token',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    }
    /**
     * Register a new user
     * @param requestBody
     * @returns User User created
     * @throws ApiError
     */
    public static postAuthRegister(
        requestBody?: CreateUserRequest,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List businesses (Admin only)
     * @returns Business List of businesses
     * @throws ApiError
     */
    public static getBusinesses(): CancelablePromise<Array<Business>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/businesses',
        });
    }
    /**
     * Create a business profile
     * @param requestBody
     * @returns Business Created
     * @throws ApiError
     */
    public static postBusinesses(
        requestBody?: CreateBusinessRequest,
    ): CancelablePromise<Business> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/businesses',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Find matching influencers within radius
     * @param businessId
     * @param radiusMeters
     * @returns any List of matching influencers
     * @throws ApiError
     */
    public static getBusinessesMatches(
        businessId: UUID,
        radiusMeters: number = 5000,
    ): CancelablePromise<Array<(Influencer & {
        distance_meters?: number;
    })>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/businesses/{business_id}/matches',
            path: {
                'business_id': businessId,
            },
            query: {
                'radius_meters': radiusMeters,
            },
        });
    }
    /**
     * List campaigns for current user (Business or Admin)
     * @returns Campaign List campaigns
     * @throws ApiError
     */
    public static getCampaigns(): CancelablePromise<Array<Campaign>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/campaigns',
        });
    }
    /**
     * Create a new campaign
     * @param requestBody
     * @returns Campaign Created
     * @throws ApiError
     */
    public static postCampaigns(
        requestBody?: CreateCampaignRequest,
    ): CancelablePromise<Campaign> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/campaigns',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Launch campaign (trigger matching)
     * @param id
     * @returns any Campaign launched
     * @throws ApiError
     */
    public static postCampaignsLaunch(
        id: UUID,
    ): CancelablePromise<{
        message?: string;
        invites_sent?: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/campaigns/{id}/launch',
            path: {
                'id': id,
            },
        });
    }
    /**
     * List invites for a campaign
     * @param id
     * @returns CampaignInvite List of invites
     * @throws ApiError
     */
    public static getCampaignsInvites(
        id: UUID,
    ): CancelablePromise<Array<CampaignInvite>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/campaigns/{id}/invites',
            path: {
                'id': id,
            },
        });
    }
    /**
     * List eligible influencers matching campaign spatial logic
     * @param id
     * @param overrideRadiusMeters Optional radius override to preview reach before saving to campaign
     * @returns any List of matching influencers
     * @throws ApiError
     */
    public static getCampaignsEligibleInfluencers(
        id: UUID,
        overrideRadiusMeters?: number,
    ): CancelablePromise<Array<(Influencer & {
        distance_meters?: number;
    })>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/campaigns/{id}/eligible-influencers',
            path: {
                'id': id,
            },
            query: {
                'override_radius_meters': overrideRadiusMeters,
            },
        });
    }
    /**
     * Signal invite decision (Influencer or Business)
     * @param id
     * @param requestBody
     * @returns CampaignInvite Signal processed
     * @throws ApiError
     */
    public static postInvitesSignal(
        id: UUID,
        requestBody?: InviteSignalRequest,
    ): CancelablePromise<CampaignInvite> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/invites/{id}/signal',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
