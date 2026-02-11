import { Check } from "lucide-react";
import Link from "next/link";

const tiers = [
    {
        name: "Free",
        price: "$0",
        description: "Perfect for casual job seekers.",
        features: ["Weekly job matches", "Basic email support", "1 active search profile", "Max 10 matches/week"],
        cta: "Get Started",
        popular: false,
    },
    {
        name: "Starter",
        price: "$9",
        description: "For active job hunters.",
        features: ["Daily job matches", "Priority email support", "3 active search profiles", "Max 50 matches/week", "Salary insights"],
        cta: "Start Free Trial",
        popular: false,
    },
    {
        name: "Pro",
        price: "$19",
        description: "Best value for serious candidates.",
        features: ["Hourly job matches", "Instant notifications", "Unlimited search profiles", "Unlimited matches", "Salary negotiation guide", "CV review credits"],
        cta: "Start Free Trial",
        popular: true,
    },
    {
        name: "Power User",
        price: "$49",
        description: "Agency-level tools.",
        features: ["Real-time API access", "Dedicated account manager", "White-label reports", "Export to ATS", "Interview coaching"],
        cta: "Contact Sales",
        popular: false,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-white dark:bg-black">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl mb-4">Simple, transparent pricing</h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Choose the plan that fits your career goals. Cancel anytime.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {tiers.map((tier) => (
                        <div key={tier.name} className={`relative flex flex-col p-8 bg-white rounded-3xl border ${tier.popular ? "border-blue-600 shadow-xl scale-105 z-10" : "border-zinc-200 shadow-sm"} dark:bg-zinc-900 dark:border-zinc-800`}>
                            {tier.popular && <div className="absolute top-0 right-0 -mt-3 mr-3 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">Most Popular</div>}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{tier.name}</h3>
                                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{tier.description}</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-zinc-900 dark:text-white">{tier.price}</span>
                                <span className="text-zinc-500 dark:text-zinc-400">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <Check className="h-5 w-5 text-blue-500 shrink-0 mr-3" />
                                        <span className="text-sm text-zinc-600 dark:text-zinc-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup" className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-colors text-center ${tier.popular ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"}`}>
                                {tier.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
