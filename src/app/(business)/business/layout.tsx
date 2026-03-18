import Link from "next/link"
import { LayoutDashboard, Building2, Ticket } from "lucide-react"

export default function BusinessLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-slate-50">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white sm:flex">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-primary">
                        <Building2 className="h-6 w-6" />
                        <span className="text-xl">Spot.me Business</span>
                    </Link>
                </div>
                <nav className="flex flex-col gap-2 px-4 py-6">
                    <Link
                        href="/business"
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="/business/profile"
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                    >
                        <Building2 className="h-4 w-4" />
                        Business Profile
                    </Link>
                    <Link
                        href="/business/campaigns"
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                    >
                        <Ticket className="h-4 w-4" />
                        Campaigns
                    </Link>
                </nav>
            </aside>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 shadow-sm">
                    <div className="ml-auto flex items-center gap-4">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                            B
                        </div>
                    </div>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 lg:px-8 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
