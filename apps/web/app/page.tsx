"use client";

import { SignIn, useAuth } from "@digit-auth/react";

export default function Home() {
  const { isLoading, isAuthenticated, user, logout } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Checking your session...
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-semibold">ProjectVault</h1>
          <p className="mt-3 text-zinc-400">
            You're signed in to ProjectVault.
          </p>

          <p className="mt-6 text-sm text-zinc-400">Account</p>
          <p className="mt-1 break-all">{user?.email}</p>

          <div className="mt-6 flex flex-col gap-2">
            <a
              href="/dashboard"
              className="w-full rounded-lg bg-white px-4 py-2 text-center font-medium text-black hover:bg-zinc-200"
            >
              Go to Dashboard
            </a>
            <a
              href="/projects"
              className="w-full rounded-lg bg-white/10 px-4 py-2 text-center font-medium text-white hover:bg-white/20"
            >
              Projects
            </a>
            <a
              href="/notes"
              className="w-full rounded-lg bg-white/10 px-4 py-2 text-center font-medium text-white hover:bg-white/20"
            >
              Notes
            </a>
            <a
              href="/links"
              className="w-full rounded-lg bg-white/10 px-4 py-2 text-center font-medium text-white hover:bg-white/20"
            >
              Links
            </a>
          </div>

          <button
            onClick={() => void logout()}
            className="mt-6 w-full rounded-lg bg-white px-4 py-3 font-medium text-black hover:bg-zinc-200"
          >
            Sign out
          </button>
        </section>
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
          redirectUrl="/"
        />
      </div>
    </main>
  );
}
