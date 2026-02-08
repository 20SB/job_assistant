import Link from "next/link";

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 dark:bg-black/80 dark:border-zinc-800">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Job Assistant
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Link href="#how-it-works" className="hover:text-black dark:hover:text-white transition-colors">
                        How it Works
                    </Link>
                    <Link href="#pricing" className="hover:text-black dark:hover:text-white transition-colors">
                        Pricing
                    </Link>
                    <Link href="#faq" className="hover:text-black dark:hover:text-white transition-colors">
                        FAQ
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">
                        Log in
                    </Link>
                    <Link href="/signup" className="rounded-full bg-black text-white px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                        Sign up
                    </Link>
                </div>
            </div>
        </nav>
    );
}
