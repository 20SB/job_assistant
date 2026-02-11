"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, FileText, Settings, CreditCard, Briefcase, Loader2, LogOut, User, FileSpreadsheet, Bell, Shield, UserCog } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const baseNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Job Matches", icon: Briefcase },
    { href: "/exports", label: "CSV Exports", icon: FileSpreadsheet },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/cv", label: "My CV", icon: FileText },
    { href: "/preferences", label: "Preferences", icon: Settings },
    { href: "/subscription", label: "Subscription", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: UserCog },
];

const adminNavItem = { href: "/admin", label: "Admin", icon: Shield };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    // Add admin link if user is admin
    const navItems = user?.role === "admin" ? [...baseNavItems, adminNavItem] : baseNavItems;

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
                    <Link href="/dashboard" className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Job Assistant
                    </Link>
                </div>
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                                }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <User className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate dark:text-zinc-100">{user?.email ?? "User"}</p>
                            <p className="text-xs text-zinc-500 capitalize">{user?.role ?? "user"}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Mobile header + content */}
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-lg font-bold md:hidden bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Job Assistant
                        </Link>
                        <h1 className="hidden md:block text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {navItems.find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))?.label ?? "Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <span className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</span>
                        <button
                            onClick={handleLogout}
                            className="md:hidden text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                            Sign out
                        </button>
                    </div>
                </header>

                {/* Mobile bottom nav */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 flex border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                                    isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"
                                }`}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
            </div>
        </div>
    );
}
