/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Timestamp } from './Timestamp';
import type { UserRole } from './UserRole';
import type { UUID } from './UUID';
export type User = {
    id: UUID;
    email: string;
    full_name: string;
    role: UserRole;
    created_at?: Timestamp;
};

