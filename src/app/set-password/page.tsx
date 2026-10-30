"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { setPassword, SetPasswordError } from "@/lib/influencer-invites";

/**
 * Public landing page for the invite link an admin's manual-add sends (M28).
 *
 * No session is needed: the auth guard in auth-provider.tsx only covers
 * /admin and /business, and the single-use token is the only credential.
 */
const setPasswordSchema = z
    .object({
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
        message: "Passwords do not match",
        path: ["confirm"],
    });

type Outcome = { kind: "done" } | { kind: "invalid-link"; message: string };

function SetPasswordForm() {
    const token = useSearchParams().get("token");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outcome, setOutcome] = useState<Outcome | null>(
        token ? null : { kind: "invalid-link", message: "This link is missing its token." }
    );

    const form = useForm<z.infer<typeof setPasswordSchema>>({
        resolver: zodResolver(setPasswordSchema),
        defaultValues: { password: "", confirm: "" },
    });

    async function onSubmit(values: z.infer<typeof setPasswordSchema>) {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            await setPassword(token, values.password);
            setOutcome({ kind: "done" });
        } catch (e) {
            if (e instanceof SetPasswordError && e.tokenInvalid) {
                setOutcome({ kind: "invalid-link", message: e.message });
            } else {
                setError(e instanceof Error ? e.message : "Could not set your password.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    if (outcome?.kind === "done") {
        return (
            <CardContent>
                <p className="text-center">
                    Password set — sign in to the Paird app with this email.
                </p>
            </CardContent>
        );
    }

    if (outcome?.kind === "invalid-link") {
        return (
            <CardContent className="space-y-2 text-center">
                <p className="font-medium">This link has expired or has already been used.</p>
                <p className="text-sm text-muted-foreground">{outcome.message}</p>
                <p className="text-sm text-muted-foreground">
                    Ask your Spot.me contact to send you a new invite.
                </p>
            </CardContent>
        );
    }

    return (
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New password</FormLabel>
                                <FormControl>
                                    <Input type="password" autoComplete="new-password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirm"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm password</FormLabel>
                                <FormControl>
                                    <Input type="password" autoComplete="new-password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Set password
                    </Button>
                </form>
            </Form>
        </CardContent>
    );
}

export default function SetPasswordPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Set your password</CardTitle>
                    <CardDescription>
                        Choose a password for your Spot.me influencer account.
                    </CardDescription>
                </CardHeader>
                {/* useSearchParams needs a Suspense boundary for static builds. */}
                <Suspense fallback={null}>
                    <SetPasswordForm />
                </Suspense>
            </Card>
        </div>
    );
}
