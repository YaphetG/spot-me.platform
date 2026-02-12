"use client"

import { useEffect, useState } from "react"
import { AdminService, InfluencerRead, VerificationStatus } from "@/lib/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, X, ShieldAlert, ShieldCheck } from "lucide-react"

export default function InfluencersPage() {
    const [influencers, setInfluencers] = useState<InfluencerRead[]>([])
    const [loading, setLoading] = useState(true)

    const fetchInfluencers = async () => {
        try {
            const data = await AdminService.getInfluencers()
            setInfluencers(data)
        } catch (error) {
            toast.error("Failed to load influencers")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInfluencers()
    }, [])

    const handleStartVerification = async (id: string) => {
        try {
            await AdminService.postInfluencersVerificationStart(id)
            toast.success("Verification workflow started")
            setTimeout(fetchInfluencers, 1000) // Refresh after 1s
        } catch (error) {
            toast.error("Failed to start verification")
            console.error(error)
        }
    }

    const handleSignalVerification = async (id: string, decision: "APPROVE" | "REJECT") => {
        try {
            await AdminService.postInfluencersVerificationSignal(id, {
                decision: decision,
                reviewer_id: "00000000-0000-0000-0000-000000000000", // TODO: Get actual admin ID
                action: decision
            } as any) // Type cast needed until client is perfectly aligned if mismatch exists

            toast.success(`Influencer ${decision === "APPROVE" ? "Approved" : "Rejected"}`)
            setTimeout(fetchInfluencers, 1000)
        } catch (error) {
            toast.error(`Failed to ${decision.toLowerCase()} influencer`)
            console.error(error)
        }
    }

    const getStatusBadge = (status: VerificationStatus) => {
        switch (status) {
            case VerificationStatus.VERIFIED:
                return <Badge className="bg-green-500 hover:bg-green-600">VERIFIED</Badge>
            case VerificationStatus.PENDING:
                return <Badge className="bg-yellow-500 hover:bg-yellow-600 animate-pulse text-black">PENDING</Badge>
            case VerificationStatus.REJECTED:
                return <Badge variant="destructive">REJECTED</Badge>
            default:
                return <Badge variant="secondary">UNVERIFIED</Badge>
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Influencers</h1>
                <Button onClick={() => window.location.href = '/admin/influencers/new'}>
                    Add Manual
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Handle</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : influencers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No influencers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            influencers.map((influencer) => (
                                <TableRow key={influencer.id}>
                                    <TableCell className="font-medium">{influencer.handle}</TableCell>
                                    <TableCell>{influencer.platform}</TableCell>
                                    <TableCell>{getStatusBadge(influencer.verification_status || VerificationStatus.UNVERIFIED)}</TableCell>
                                    <TableCell className="text-right gap-2 flex justify-end">
                                        {influencer.verification_status === VerificationStatus.UNVERIFIED && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleStartVerification(influencer.id)}
                                            >
                                                <ShieldAlert className="w-4 h-4 mr-2" />
                                                Verify
                                            </Button>
                                        )}

                                        {influencer.verification_status === VerificationStatus.PENDING && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-500 hover:bg-green-600 text-white"
                                                    onClick={() => handleSignalVerification(influencer.id, "APPROVE")}
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleSignalVerification(influencer.id, "REJECT")}
                                                >
                                                    <X className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
