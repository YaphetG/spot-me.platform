/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
import type { VerificationDecision } from './VerificationDecision';
export type VerificationSignalRequest = {
    action: VerificationDecision;
    reviewer_id: UUID;
    reason?: string | null;
};

