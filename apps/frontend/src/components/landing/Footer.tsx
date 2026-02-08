import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-white border-t border-zinc-200 py-12 dark:bg-black dark:border-zinc-800">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Job Assistant
                    </Link>
                    <p className="text-sm text-zinc-500 mt-2 dark:text-zinc-400">© {new Date().getFullYear()} Job Assistant. All rights reserved.</p>
                </div>

                <div className="flex gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Link href="#" className="hover:text-black dark:hover:text-white transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="#" className="hover:text-black dark:hover:text-white transition-colors">
                        Terms of Service
                    </Link>
                    <Link href="#" className="hover:text-black dark:hover:text-white transition-colors">
                        Contact
                    </Link>
                </div>
            </div>
        </footer>
    );
}
