"use client";

import Link from "next/link";
import { SignUp } from "@digit-auth/react";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-4xl font-semibold tracking-tight">
            ProjectVault
          </Link>

          <p className="mt-3 text-zinc-400">
            Create your account to start your private workspace.
          </p>
        </div>

        <SignUp signInUrl="/" />
      </div>
    </main>
  );
}
