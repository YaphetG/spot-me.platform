"use client";

import { useEffect, useState } from "react";
import { DefaultService, Business } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export default function BusinessesListPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBusinesses = async () => {
        try {
            const data = await DefaultService.getBusinesses();
            setBusinesses(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load businesses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
                <Link href="/admin/businesses/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Business
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin h-6 w-6 text-primary" />
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Website</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {businesses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                        No businesses found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                businesses.map((business) => (
                                    <TableRow key={business.id}>
                                        <TableCell className="font-medium">{business.name}</TableCell>
                                        <TableCell>
                                            {business.website ? (
                                                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                    {business.website}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/admin/campaigns/new?business_id=${business.id}`}>
                                                <Button size="sm" variant="default">
                                                    <Plus className="mr-2 h-3 w-3" />
                                                    Create Campaign
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
