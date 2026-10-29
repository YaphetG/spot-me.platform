"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DefaultService, type UserRole } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { NewLocationFields } from "@/components/location-fields";
import { apiErrorDetail, createLocation, locationDefaults, locationSchema } from "@/lib/location";
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

const signupSchema = locationSchema.extend({
    full_name: z.string().min(1, "Full name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<SignupValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            ...locationDefaults,
        },
    });

    async function onSubmit(values: SignupValues) {
        setIsLoading(true);
        try {
            // 1. The account. Self-sign-up only ever creates business owners.
            try {
                await DefaultService.postAuthRegister({
                    full_name: values.full_name,
                    email: values.email,
                    password: values.password,
                    role: "BUSINESS" as UserRole,
                });
            } catch (error) {
                const detail = apiErrorDetail(error, "Could not create your account.");
                form.setError(/email/i.test(detail) ? "email" : "root", { message: detail });
                return;
            }

            // 2. A session for the new account; stay here until step 3 is done.
            try {
                const { access_token } = await DefaultService.postAuthToken({
                    username: values.email,
                    password: values.password,
                });
                if (!access_token) throw new Error("No token returned.");
                await login(access_token, null);
            } catch (error) {
                console.error(error);
                form.setError("root", {
                    message: "Your account was created, but we could not sign you in. Please sign in to continue.",
                });
                return;
            }

            // 3. The first location. If this fails the account still exists and
            // is signed in, so send them to finish setting it up.
            try {
                await createLocation(values);
            } catch (error) {
                toast.error("Your account is ready, but the location was not saved", {
                    description: apiErrorDetail(error, "Add your first location to finish setting up."),
                });
                router.push("/business/profile");
                return;
            }

            toast.success("Welcome to Spot.me!");
            router.push("/business");
        } finally {
            setIsLoading(false);
        }
    }

    const rootError = form.formState.errors.root?.message;

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4 py-10">
            <Card className="w-full max-w-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Create a business account</CardTitle>
                    <CardDescription>
                        Set up your account and your first location to start finding local influencers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-sm font-semibold">Your account</h2>
                                <FormField
                                    control={form.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full name</FormLabel>
                                            <FormControl>
                                                <Input autoComplete="name" placeholder="Jane Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" autoComplete="email" placeholder="you@business.com" {...field} />
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
                                                <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-sm font-semibold">Your first location</h2>
                                <NewLocationFields />
                            </div>

                            {rootError && (
                                <p role="alert" className="text-sm font-medium text-destructive">
                                    {rootError}
                                </p>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create account
                            </Button>
                        </form>
                    </Form>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
