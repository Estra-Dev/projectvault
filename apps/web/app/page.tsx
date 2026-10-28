"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignIn, useAuth } from "@digit-auth/react";

export default function Home() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        {isLoading
          ? "Checking your session..."
          : "Taking you to your dashboard..."}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            ProjectVault
          </h1>
          <p className="mt-3 text-zinc-400">
            Your private workspace for projects, notes, and links.
          </p>
        </div>

        <SignIn
          signUpUrl="/sign-up"
          resetPasswordUrl="/reset-password"
          redirectUrl="/dashboard"
        />
      </div>
    </main>
  );
}
