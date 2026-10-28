"use client";

import { useAuth } from "@digit-auth/react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  _id: string;
  id?: string;
  title: string;
}

interface Note {
  _id: string;
  id?: string;
  title: string;
}

interface LinkItem {
  _id: string;
  id?: string;
  title: string;
  url: string;
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { isLoading, isAuthenticated, getAccessToken } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
  ).replace(/\/+$/, "");

  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated) return;

    const token = getAccessToken();
    if (!token) {
      setError("Your session token is missing. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [projectsRes, notesRes, linksRes] = await Promise.allSettled([
        fetch(`${apiBaseUrl}/projects`, { headers, cache: "no-store" }),
        fetch(`${apiBaseUrl}/notes`, { headers, cache: "no-store" }),
        fetch(`${apiBaseUrl}/links`, { headers, cache: "no-store" }),
      ]);

      if (projectsRes.status === "fulfilled" && projectsRes.value.ok) {
        const data = await projectsRes.value.json();
        setProjects(data.projects ?? []);
      }
      if (notesRes.status === "fulfilled" && notesRes.value.ok) {
        const data = await notesRes.value.json();
        setNotes(data.notes ?? []);
      }
      if (linksRes.status === "fulfilled" && linksRes.value.ok) {
        const data = await linksRes.value.json();
        setLinks(data.links ?? []);
      }

      const allFailed =
        projectsRes.status === "rejected" &&
        notesRes.status === "rejected" &&
        linksRes.status === "rejected";
      if (allFailed) {
        setError("Failed to load dashboard data.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, getAccessToken, isAuthenticated]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }
    void fetchCounts();
  }, [isLoading, isAuthenticated, fetchCounts]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <section className="w-full max-w-md rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8 shadow-[0_60px_120px_-80px_rgba(99,102,241,0.5)]">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-3 text-zinc-400">Please sign in to access your dashboard.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors">
            Go to sign in
            <ArrowIcon />
          </Link>
        </section>
      </div>
    );
  }

  const totalCount = projects.length + notes.length + links.length;
  const hasData = totalCount > 0;

  return (
    <div className="w-full space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/10 via-transparent to-blue-500/5 p-6 sm:p-8 lg:p-10">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-sm text-indigo-300">Workspace overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            A clean, focused view of your private projects, notes, and links.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-[0_20px_60px_-40px_rgba(99,102,241,0.9)] hover:opacity-90 transition-opacity"
            >
              New Project
              <ArrowIcon />
            </Link>
            <Link
              href="/notes"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.02] transition-colors"
            >
              New Note
            </Link>
            <Link
              href="/links"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.02] transition-colors"
            >
              Add Link
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/projects"
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:shadow-[0_60px_120px_-80px_rgba(99,102,241,0.8)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Projects</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">
                {loading && projects.length === 0 ? "—" : projects.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.25 5.25L9 2.25L15.75 5.25V12.75L9 15.75L2.25 12.75V5.25Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">
            View all projects
            <ArrowIcon />
          </div>
        </Link>

        <Link
          href="/notes"
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-[0_60px_120px_-80px_rgba(59,130,246,0.8)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Notes</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">
                {loading && notes.length === 0 ? "—" : notes.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.25 2.25H12.75C13.9926 2.25 15 3.25736 15 4.5V13.5C15 14.7426 13.9926 15.75 12.75 15.75H5.25C4.00736 15.75 3 14.7426 3 13.5V4.5C3 3.25736 4.00736 2.25 5.25 2.25Z" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">
            View all notes
            <ArrowIcon />
          </div>
        </Link>

        <Link
          href="/links"
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-[0_60px_120px_-80px_rgba(34,211,238,0.8)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Links</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">
                {loading && links.length === 0 ? "—" : links.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.25 6L9.375 4.875C10.4105 3.83947 12.0895 3.83947 13.125 4.875C14.1605 5.91053 14.1605 7.58947 13.125 8.625L12 9.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M9.75 12L8.625 13.125C7.58947 14.1605 5.91053 14.1605 4.875 13.125C3.83947 12.0895 3.83947 10.4105 4.875 9.375L6 8.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">
            View all links
            <ArrowIcon />
          </div>
        </Link>
      </div>

      {!loading && !error && !hasData && (
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-6 text-center sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <h2 className="text-xl font-semibold tracking-tight">Start building your workspace</h2>
          <p className="mt-2 text-zinc-400">
            Your private space is ready. Create projects, capture notes, and save important links.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Create your first project
              <ArrowIcon />
            </Link>
            <Link
              href="/notes"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.02] transition-colors"
            >
              Write a note
            </Link>
            <Link
              href="/links"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.02] transition-colors"
            >
              Save a link
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
