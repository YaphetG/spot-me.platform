import { OpenAPI } from "@/lib/api-client/core/OpenAPI";

/**
 * Base URL for every API call, generated client and `apiFetch` alike.
 *
 * The generated client hardcodes `http://localhost:8000/api/v1`, which only
 * works for a browser running on the same machine as the API. The default
 * here is the same-origin path instead: `next.config.ts` proxies `/api/v1/*`
 * to the backend, so the browser only ever needs to reach this app (no CORS,
 * no second port to open). Set `NEXT_PUBLIC_API_URL` to call an API directly.
 *
 * Kept outside `api-client/` so regenerating the client does not undo it.
 */
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
