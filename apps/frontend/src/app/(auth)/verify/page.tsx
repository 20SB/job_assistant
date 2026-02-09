import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function VerifyPage() {
    return (
        <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                        <Mail className="h-6 w-6 text-blue-600 dark:text-blue-200" />
                    </div>
                </div>
                <CardTitle>Check your email</CardTitle>
                <CardDescription>We&apos;ve sent a verification link to your email address.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Click the link in the email to verify your account and continue to onboarding.</p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">Back to Login</Link>
                </Button>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Didn&apos;t receive the email? <button className="underline hover:text-zinc-900 dark:hover:text-zinc-50">Resend</button>
                </p>
            </CardFooter>
        </Card>
    );
}
