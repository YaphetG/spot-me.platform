"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    submitRegistrationDetails,
    type BusinessVerification,
    type RegistrationDetails,
} from "@/lib/business-verification";

const EMPTY: RegistrationDetails = { legal_name: "", registration_number: "", country: "" };

/**
 * Collects the business's registration details so an admin can verify it.
 * Shown at the first launch, and again to resubmit after a rejection.
 */
export function BusinessVerificationDialog({
    open,
    onOpenChange,
    onSubmitted,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmitted: (verification: BusinessVerification) => void;
}) {
    const [details, setDetails] = useState<RegistrationDetails>(EMPTY);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (field: keyof RegistrationDetails) =>
        (e: ChangeEvent<HTMLInputElement>) =>
            setDetails(d => ({ ...d, [field]: e.target.value }));

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = {
            legal_name: details.legal_name.trim(),
            registration_number: details.registration_number.trim(),
            country: details.country.trim(),
        };
        if (!trimmed.legal_name || !trimmed.registration_number || !trimmed.country) {
            setError("All three fields are required.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const verification = await submitRegistrationDetails(trimmed);
            setDetails(EMPTY);
            onSubmitted(verification);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not submit your details.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={onSubmit} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>Verify your business</DialogTitle>
                        <DialogDescription>
                            Before your first campaign goes live, we check that your business is
                            registered. An admin reviews these details; you can keep editing
                            drafts in the meantime.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label htmlFor="legal_name">Legal name</Label>
                        <Input id="legal_name" value={details.legal_name} onChange={set("legal_name")} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="registration_number">Registration number</Label>
                        <Input
                            id="registration_number"
                            value={details.registration_number}
                            onChange={set("registration_number")}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" value={details.country} onChange={set("country")} />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm font-medium text-destructive">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit for review
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
