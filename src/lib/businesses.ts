import { apiGet } from "@/lib/api-fetch";

/**
 * The signed-in owner's businesses.
 *
 * An account may run several businesses (multi-location, issue M20). The
 * business portal used `GET /businesses/me`, which picked one arbitrarily;
 * it now returns 409 when the choice is ambiguous. `GET /businesses` is scoped
 * server-side to the caller's own businesses.
 */
export interface MyBusiness {
    id: string;
    name: string;
    description: string | null;
    website: string | null;
}

export function fetchMyBusinesses(): Promise<MyBusiness[]> {
    return apiGet<MyBusiness[]>("/businesses");
}
