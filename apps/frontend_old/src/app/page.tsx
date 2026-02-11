import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
    return (
        <main className="min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-zinc-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            <Navbar />
            <Hero />
            <HowItWorks />
            <Pricing />
            <FAQ />
            <Footer />
        </main>
    );
}
