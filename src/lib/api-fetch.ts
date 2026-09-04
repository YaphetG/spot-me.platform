import { OpenAPI } from "@/lib/api-client/core/OpenAPI";

/**
 * Authenticated fetch against the API.
 *
 * The business portal previously called `fetch("http://localhost:8000/...")`
 * directly, with the host hardcoded in every call site and no Authorization
 * header at all — which stopped working the moment the API began enforcing
 * auth. This routes through the same base URL and token the generated client
 * uses, so there is one place to configure both.
 */
export async function apiFetch(
    path: string,
    init: RequestInit = {}
): Promise<Response> {
    const token =
        typeof OpenAPI.TOKEN === "string" ? OpenAPI.TOKEN : undefined;

    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(`${OpenAPI.BASE}${path}`, { ...init, headers });
}

/** GET returning parsed JSON, or throwing with the API's error detail. */
export async function apiGet<T>(path: string): Promise<T> {
    const res = await apiFetch(path);
    if (!res.ok) throw await toError(res);
    return (await res.json()) as T;
}

/** Send JSON and parse the response, or throw with the API's error detail. */
export async function apiSend<T>(
    path: string,
    method: "POST" | "PATCH" | "PUT" | "DELETE",
    body?: unknown
): Promise<T> {
    const res = await apiFetch(path, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw await toError(res);
    return (await res.json()) as T;
}

async function toError(res: Response): Promise<Error> {
    let detail = `Request failed (${res.status})`;
    try {
        const body = await res.json();
        if (typeof body?.detail === "string") detail = body.detail;
    } catch {
        /* non-JSON error body */
    }
    return new Error(detail);
}
