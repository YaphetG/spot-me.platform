"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { OpenAPI } from "@/lib/api-client/core/OpenAPI";
import { DefaultService } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Initialize from localStorage
        const storedToken = localStorage.getItem("spotme_admin_token");
        if (storedToken) {
            setToken(storedToken);
            OpenAPI.TOKEN = storedToken;
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        // Protect routes - very basic client side protection for now
        if (isInitialized && !token && pathname.startsWith("/admin")) {
            router.push("/login");
        }
    }, [isInitialized, token, pathname, router]);

    const login = (newToken: string) => {
        localStorage.setItem("spotme_admin_token", newToken);
        setToken(newToken);
        OpenAPI.TOKEN = newToken;
        router.push("/admin/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("spotme_admin_token");
        setToken(null);
        OpenAPI.TOKEN = undefined;
        router.push("/login");
    };

    if (!isInitialized) {
        return null; // or a loading spinner
    }

    return (
        <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
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
