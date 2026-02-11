'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        await authApi.verifyEmail(token!);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('An unexpected error occurred');
        }
      }
    }

    verify();
  }, [token]);

  if (status === 'idle') {
    return (
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-200" />
            </div>
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Click the link in the email to verify your account and continue to onboarding.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === 'verifying') {
    return (
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
          <CardTitle>Verifying your email...</CardTitle>
          <CardDescription>Please wait while we verify your email address.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-200" />
            </div>
          </div>
          <CardTitle>Email verified!</CardTitle>
          <CardDescription>Your email address has been verified successfully.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You can now sign in to your account.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto text-center">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-200" />
          </div>
        </div>
        <CardTitle>Verification failed</CardTitle>
        <CardDescription>
          {errorMessage || 'The verification link is invalid or has expired.'}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col space-y-2">
        <Button className="w-full" asChild>
          <Link href="/signup">Try signing up again</Link>
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">Back to Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function VerifyPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
