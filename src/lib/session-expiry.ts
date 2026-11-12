/**
 * Session-expiry plumbing shared by `apiFetch` and the auth provider.
 *
 * Access tokens expire after 30 minutes and there is no refresh token, so the
 * portal has to notice expiry itself. This module stays free of React so
 * `src/lib` doesn't depend on the auth context: the provider registers a
 * listener here, and `apiFetch` reports 401s to it.
 */

type UnauthorizedListener = (token: string) => void;

let listener: UnauthorizedListener | null = null;

/** Register the handler for a 401 on a request that carried `token`. Returns an unsubscribe. */
export function onUnauthorized(fn: UnauthorizedListener): () => void {
    listener = fn;
    return () => {
        if (listener === fn) listener = null;
    };
}

/** Report that a request carrying `token` was rejected with 401. */
export function notifyUnauthorized(token: string): void {
    listener?.(token);
}

/**
 * The token's `exp` claim in epoch milliseconds, or null if it has none.
 *
 * Decoded without verifying the signature: this only decides when to stop
 * showing the portal. The server still enforces expiry on every request.
 */
export function tokenExpiresAt(token: string): number | null {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
        return typeof json?.exp === "number" ? json.exp * 1000 : null;
    } catch {
        return null;
    }
}

/**
 * `next` if it's an in-app portal path, else null.
 *
 * Only `/admin` and `/business` paths are accepted, so a crafted
 * `/login?next=https://…` or `//host` can't send the user off-site.
 */
export function safeNextPath(next: string | null): string | null {
    if (!next) return null;
    if (!/^\/(admin|business)(?=[/?#]|$)/.test(next)) return null;
    // Reject backslashes, which some browsers treat as "/" ("/admin\\..\\..").
    if (next.includes("\\")) return null;
    return next;
}
