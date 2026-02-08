import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
    return (
        <section className="pt-32 pb-16 md:pt-48 md:pb-32 px-4 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-white dark:from-blue-950/20 dark:via-black dark:to-black"></div>

            <div className="container mx-auto text-center max-w-4xl">
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800 mb-8 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300">
                    <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                    Now searching 10,000+ new jobs daily
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-8 dark:text-white">
                    Stop Searching. <br />
                    Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Interviewing.</span>
                </h1>

                <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto dark:text-zinc-400">Our AI analyzes your CV and delivers perfectly matched job opportunities directly to your inbox. No more scrolling, just applying.</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/signup" className="h-12 px-8 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors w-full sm:w-auto">
                        Get Started for Free
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="#how-it-works" className="h-12 px-8 rounded-full border border-zinc-200 bg-white text-zinc-900 font-medium flex items-center justify-center hover:bg-zinc-50 transition-colors dark:bg-black dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-900 w-full sm:w-auto">
                        How it works
                    </Link>
                </div>
            </div>
        </section>
    );
}
