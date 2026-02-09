export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
            <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight">Job Assistant</h1>
                    <nav className="flex items-center space-x-4">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">user@example.com</span>
                        <button className="text-sm font-medium text-red-600 hover:underline">Sign out</button>
                    </nav>
                </div>
            </header>
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
