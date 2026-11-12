"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { OpenAPI } from "@/lib/api-client/core/OpenAPI";
import "@/lib/api-config";
import { onUnauthorized, tokenExpiresAt } from "@/lib/session-expiry";
import { useRouter, usePathname } from "next/navigation";

const TOKEN_KEY = "spotme_admin_token";

type Role = "ADMIN" | "BUSINESS" | "INFLUENCER" | "AGENT";

interface CurrentUser {
    id: string;
    email: string;
    full_name?: string | null;
    role: Role;
}

interface AuthContextType {
    token: string | null;
    user: CurrentUser | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    /** Store the session, then go to `redirectTo` (default: the role's home; null: stay). */
    login: (token: string, redirectTo?: string | null) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Landing route for each role after signing in. */
function homeForRole(role: Role): string {
    return role === "ADMIN" ? "/admin/dashboard" : "/business";
}

/**
 * Read the signed-in user from the API.
 *
 * The role must come from the server: the JWT only carries the subject, and a
 * client-side claim would be trivially forgeable anyway.
 */
async function fetchCurrentUser(token: string): Promise<CurrentUser | null> {
    try {
        const res = await fetch(`${OpenAPI.BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        return (await res.json()) as CurrentUser;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    // Set when the session ended on its own, so the route guard sends the
    // user to /login with a message and a way back, not a bare redirect.
    const [expired, setExpired] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Restore a stored session on load.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const stored = localStorage.getItem(TOKEN_KEY);
            if (stored) {
                OpenAPI.TOKEN = stored;
                const me = await fetchCurrentUser(stored);
                if (me) {
                    if (!cancelled) {
                        setToken(stored);
                        setUser(me);
                    }
                } else {
                    // Expired or revoked.
                    localStorage.removeItem(TOKEN_KEY);
                    OpenAPI.TOKEN = undefined;
                    if (!cancelled) setExpired(true);
                }
            }
            if (!cancelled) setIsInitialized(true);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Route protection. Both portals are guarded, and /admin additionally
    // requires the ADMIN role — previously /business had no protection at all
    // and any authenticated user could open /admin. Everything else is public,
    // including /set-password, which invited influencers open without a session.
    useEffect(() => {
        if (!isInitialized) return;

        const needsAuth =
            pathname.startsWith("/admin") || pathname.startsWith("/business");

        if (needsAuth && !token) {
            if (expired) {
                const next = encodeURIComponent(pathname + window.location.search);
                router.replace(`/login?expired=1&next=${next}`);
            } else {
                router.replace("/login");
            }
            return;
        }
        if (pathname.startsWith("/admin") && user && user.role !== "ADMIN") {
            router.replace("/business");
        }
    }, [isInitialized, token, user, expired, pathname, router]);

    // End the session when the token expires. Clears it as logout() does; the
    // route guard above then does the redirect.
    const expireSession = useCallback(() => {
        OpenAPI.TOKEN = undefined;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setExpired(true);
    }, []);

    // Expire at the token's own `exp`. This covers the generated
    // DefaultService too, without touching its code. Timers don't run
    // reliably in background tabs, so check again when the tab regains focus.
    useEffect(() => {
        if (!token) return;
        const expiresAt = tokenExpiresAt(token);
        if (expiresAt === null) return;

        const check = () => {
            if (Date.now() >= expiresAt) expireSession();
        };
        // setTimeout's delay is a 32-bit int; longer would fire at once.
        const delay = Math.min(Math.max(expiresAt - Date.now(), 0), 2 ** 31 - 1);
        const timer = setTimeout(check, delay);
        const onVisible = () => {
            if (document.visibilityState === "visible") check();
        };
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", check);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", check);
        };
    }, [token, expireSession]);

    // Backstop: apiFetch reports a 401 on a request that carried a token.
    // Ignore it if that token is no longer the current one (a stale request
    // finishing after a re-login).
    useEffect(
        () =>
            onUnauthorized((sent) => {
                if (sent === OpenAPI.TOKEN) expireSession();
            }),
        [expireSession]
    );

    const login = useCallback(
        async (newToken: string, redirectTo?: string | null) => {
            OpenAPI.TOKEN = newToken;
            const me = await fetchCurrentUser(newToken);
            if (!me) {
                OpenAPI.TOKEN = undefined;
                throw new Error("Could not load your account.");
            }
            localStorage.setItem(TOKEN_KEY, newToken);
            setToken(newToken);
            setUser(me);
            setExpired(false);
            // null means the caller navigates itself (sign-up has more to do).
            if (redirectTo !== null) router.push(redirectTo ?? homeForRole(me.role));
        },
        [router]
    );

    const logout = useCallback(() => {
        // Clear the API client's token first so no further request carries it.
        OpenAPI.TOKEN = undefined;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setExpired(false);
        router.push("/login");
    }, [router]);

    if (!isInitialized) {
        return null;
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                login,
                logout,
                isAuthenticated: !!token,
                isAdmin: user?.role === "ADMIN",
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
