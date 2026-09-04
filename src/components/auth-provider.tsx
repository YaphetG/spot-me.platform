"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { OpenAPI } from "@/lib/api-client/core/OpenAPI";
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
    login: (token: string) => Promise<void>;
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
    // and any authenticated user could open /admin.
    useEffect(() => {
        if (!isInitialized) return;

        const needsAuth =
            pathname.startsWith("/admin") || pathname.startsWith("/business");

        if (needsAuth && !token) {
            router.replace("/login");
            return;
        }
        if (pathname.startsWith("/admin") && user && user.role !== "ADMIN") {
            router.replace("/business");
        }
    }, [isInitialized, token, user, pathname, router]);

    const login = useCallback(
        async (newToken: string) => {
            OpenAPI.TOKEN = newToken;
            const me = await fetchCurrentUser(newToken);
            if (!me) {
                OpenAPI.TOKEN = undefined;
                throw new Error("Could not load your account.");
            }
            localStorage.setItem(TOKEN_KEY, newToken);
            setToken(newToken);
            setUser(me);
            router.push(homeForRole(me.role));
        },
        [router]
    );

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        OpenAPI.TOKEN = undefined;
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
