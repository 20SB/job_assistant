export function FAQ() {
    const faqs = [
        {
            question: "How does the AI matching algorithm work?",
            answer: "Our AI analyzes the semantic meaning of your CV—identifying skills, experience levels, and industry context—and compares it against thousands of job descriptions to find high-relevance matches that keyword searches often miss.",
        },
        {
            question: "Is my personal data safe?",
            answer: "Absolutely. We encrypt all user data and never share your personal information with third parties without your explicit consent. Your CV is used solely for matching purposes.",
        },
        {
            question: "Which job boards do you source from?",
            answer: "We currently aggregate jobs from Adzuna's extensive network, which covers major job boards and company career pages globally. We're constantly adding more sources.",
        },
        {
            question: "Can I cancel my subscription at any time?",
            answer: "Yes, you can cancel your subscription instantly from your dashboard. You'll retain access until the end of your billing cycle.",
        },
        {
            question: "Do you support all industries?",
            answer: "We support most white-collar professions including Tech, Finance, Marketing, Sales, Healthcare, and Engineering. We are expanding to more sectors soon.",
        },
    ];

    return (
        <section id="faq" className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl mb-4">Frequently Asked Questions</h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">Have a question? We're here to help.</p>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <details key={index} className="group p-6 bg-white rounded-2xl border border-zinc-200 open:ring-1 open:ring-blue-100 dark:bg-black dark:border-zinc-800">
                            <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-lg text-zinc-900 dark:text-white">
                                <span>{faq.question}</span>
                                <span className="transition group-open:rotate-180">
                                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24">
                                        <path d="M6 9l6 6 6-6"></path>
                                    </svg>
                                </span>
                            </summary>
                            <p className="text-zinc-600 mt-3 group-open:animate-fadeIn dark:text-zinc-400 leading-relaxed">{faq.answer}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
