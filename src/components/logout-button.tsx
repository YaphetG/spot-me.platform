"use client";

import { LogOut } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

/** Signed-in email plus a "Log out" control for the portal sidebars. */
export function LogoutButton() {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col gap-2 border-t px-4 py-4">
            {user && (
                <span className="truncate text-sm text-muted-foreground" title={user.email}>
                    {user.email}
                </span>
            )}
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Log out
            </Button>
        </div>
    );
}
