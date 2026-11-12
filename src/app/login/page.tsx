"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { DefaultService } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { safeNextPath } from "@/lib/session-expiry";
import { toast } from "sonner";
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

const loginSchema = z.object({
    username: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

function LoginForm() {
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    // Set by the auth provider when a session ends on its own. Hidden once the
    // user tries to sign in, so a failure only shows its own error.
    const [showExpired, setShowExpired] = useState(searchParams.get("expired") === "1");
    const next = safeNextPath(searchParams.get("next"));

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsLoading(true);
        setShowExpired(false);
        try {
            const formData = {
                username: values.username,
                password: values.password,
            };

            // Call the login endpoint (OAuth2 password flow expects form data)
            const response = await DefaultService.postAuthToken(formData);

            if (response.access_token) {
                // login() loads the account to learn its role, then routes to
                // the right portal, or back to where the session expired.
                // Await it so a failure surfaces here.
                await login(response.access_token, next ?? undefined);
                toast.success("Successfully logged in!");
            } else {
                toast.error("Invalid credentials.");
            }
        } catch (error) {
            console.error(error);
            const description =
                error instanceof Error && error.message
                    ? error.message
                    : "Invalid email or password.";
            toast.error("Failed to login", { description });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <CardContent>
            {showExpired && (
                <p
                    role="status"
                    className="mb-4 rounded-md border bg-muted px-3 py-2 text-center text-sm"
                >
                    Your session expired. Sign in again.
                </p>
            )}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="admin@spot.me" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Sign In
                    </Button>
                </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                New to Spot.me?{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                    Create a business account
                </Link>
            </p>
        </CardContent>
    );
}

export default function LoginPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Login to Spot.me</CardTitle>
                    <CardDescription>
                        Sign in to your business or admin account.
                    </CardDescription>
                </CardHeader>
                {/* useSearchParams needs a Suspense boundary for static builds. */}
                <Suspense fallback={null}>
                    <LoginForm />
                </Suspense>
            </Card>
        </div>
    );
}
