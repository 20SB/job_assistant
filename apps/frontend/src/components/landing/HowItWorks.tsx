import { Upload, Settings, Cpu, Mail } from "lucide-react";

const steps = [
    {
        icon: Upload,
        title: "1. Upload your CV",
        description: "Simply paste your CV text or upload a PDF. Our system extracts your skills and experience instantly.",
    },
    {
        icon: Settings,
        title: "2. Set Preferences",
        description: "Tell us what you're looking for: Remote, Salary range, Role type, and more.",
    },
    {
        icon: Cpu,
        title: "3. AI Matching",
        description: "Our engine scans thousands of new jobs daily and ranks them against your unique profile.",
    },
    {
        icon: Mail,
        title: "4. Get Notified",
        description: "Receive a curated CSV of the top matches in your inbox. Apply only to jobs that fit.",
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl mb-4">How it works</h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">We've streamlined the job hunt into four simple steps.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow dark:bg-zinc-900 dark:border-zinc-800">
                            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 dark:bg-blue-900/30 dark:text-blue-400">
                                <step.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-900 mb-3 dark:text-white">{step.title}</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
