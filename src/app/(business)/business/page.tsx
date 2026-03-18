import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Ticket, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function BusinessDashboardPage() {
    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-2">Welcome to your Spot.me Business Portal. Manage your profile and campaigns here.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link href="/business/campaigns/new">
                            <Ticket className="h-4 w-4" />
                            Launch Campaign
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Active Campaigns</CardTitle>
                        <Ticket className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">0</div>
                        <p className="text-xs text-slate-500 mt-1">Ready to launch a new campaign</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Influencer Matches</CardTitle>
                        <Users className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">0</div>
                        <p className="text-xs text-slate-500 mt-1">Waiting for your first campaign</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Profile Views</CardTitle>
                        <Building2 className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">--</div>
                        <p className="text-xs text-slate-500 mt-1">Make sure your profile is updated</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
