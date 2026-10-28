"use client";

import { useAuth } from "@digit-auth/react";
import { useCallback, useEffect, useState } from "react";

interface LinkItem {
  _id: string;
  id?: string;
  title: string;
  url: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LinksResponse {
  links: LinkItem[];
}

interface LinkResponse {
  link: LinkItem;
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3.5V12.5M3.5 8H12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.3333 2.66675L13.3333 4.66675L5.33333 12.6667H3.33333V10.6667L11.3333 2.66675Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.66667 4H13.3333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 4V2.66667H10V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4V13.3333C12 14 11.3333 14.6667 10.6667 14.6667H5.33333C4.66667 14.6667 4 14 4 13.3333V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.16667 11.6667L11.6667 9.16667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 6.66667L11.25 5.41667C12.4006 4.26607 14.2661 4.26607 15.4167 5.41667C16.5673 6.56727 16.5673 8.43273 15.4167 9.58333L14.1667 10.8333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.8333 13.3333L9.58333 14.5833C8.43273 15.7339 6.56727 15.7339 5.41667 14.5833C4.26607 13.4327 4.26607 11.5673 5.41667 10.4167L6.66667 9.16667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.83333 2.33333H11.6667V8.16667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.6667 2.33333L5.25 8.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.33333 11.6667H2.33333V4.66667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LinksPage() {
  const { isLoading, isAuthenticated, getAccessToken } = useAuth();

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
  ).replace(/\/+$/, "");

  const requestApi = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = getAccessToken();

      if (!token) {
        throw new Error("Your session token is missing. Please sign in again.");
      }

      const response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please sign in again.");
        }

        let message = `Request failed (${response.status}).`;

        try {
          const body = (await response.json()) as {
            message?: string;
            error?: string;
          };

          message = body.message || body.error || message;
        } catch {
          // Keep fallback
        }

        throw new Error(message);
      }

      return (await response.json()) as T;
    },
    [apiBaseUrl, getAccessToken],
  );

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await requestApi<LinksResponse>("/links");
      setLinks(response.links ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load links.");
    } finally {
      setLoading(false);
    }
  }, [requestApi]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }
    void fetchLinks();
  }, [isLoading, isAuthenticated, fetchLinks]);

  const createLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
    const trimmedDescription = description.trim();

    if (!isAuthenticated || !trimmedTitle || !trimmedUrl || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await requestApi<LinkResponse>("/links", {
        method: "POST",
        body: JSON.stringify({
          title: trimmedTitle,
          url: trimmedUrl,
          description: trimmedDescription || undefined,
        }),
      });

      setLinks((previous) => [
        response.link,
        ...previous.filter((link) => (link._id || link.id) !== (response.link._id || response.link.id)),
      ]);
      setTitle("");
      setUrl("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (link: LinkItem) => {
    const linkId = link._id || link.id || "";
    setEditingId(linkId);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditDescription(link.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditUrl("");
    setEditDescription("");
  };

  const saveEdit = async (linkId: string) => {
    const trimmedTitle = editTitle.trim();
    const trimmedUrl = editUrl.trim();
    const trimmedDescription = editDescription.trim();

    if (!trimmedTitle || !trimmedUrl || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await requestApi<LinkResponse>(`/links/${linkId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: trimmedTitle,
          url: trimmedUrl,
          description: trimmedDescription,
        }),
      });

      setLinks((previous) =>
        previous.map((link) =>
          (link._id || link.id) === linkId ? response.link : link
        )
      );
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update link.");
    } finally {
      setLoading(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await requestApi(`/links/${linkId}`, {
        method: "DELETE",
      });

      setLinks((previous) =>
        previous.filter((link) => (link._id || link.id) !== linkId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete link.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-semibold tracking-tight">Links</h1>
          <p className="mt-3 text-zinc-400">Please sign in to access your links.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Links</h1>
          <p className="mt-2 text-zinc-400">A curated library of saved resources</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchLinks()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.02] transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent w-full">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        <form onSubmit={createLink} className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
              <PlusIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Add new link</h2>
              <p className="text-sm text-zinc-400">Save useful URLs with optional context</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="link-title" className="text-sm text-zinc-300">
                Title
              </label>
              <input
                id="link-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Documentation"
                aria-label="Link title"
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 transition-all"
                maxLength={200}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="link-url" className="text-sm text-zinc-300">
                URL
              </label>
              <input
                id="link-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                aria-label="Link URL"
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 transition-all"
                maxLength={2048}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="link-description" className="text-sm text-zinc-300">
                Description <span className="text-zinc-500">(optional)</span>
              </label>
              <textarea
                id="link-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a short note about this link..."
                aria-label="Link description"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 transition-all"
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !url.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-[0_20px_60px_-40px_rgba(34,211,238,0.9)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <PlusIcon />
              {loading ? "Adding..." : "Add link"}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
          {error.includes("sign in again") && (
            <p className="mt-2 text-xs text-red-200/80">Return to the sign-in page and sign in again.</p>
          )}
        </div>
      )}

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Your links</h2>
            <p className="mt-1 text-sm text-zinc-400">All links visible only to you</p>
          </div>
        </div>

        {loading && links.length === 0 ? (
          <div className="mt-6 flex items-center justify-center rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              Loading links...
            </div>
          </div>
        ) : links.length === 0 && !error ? (
          <div className="mt-6 relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.02] text-zinc-400">
              <LinkIcon />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">No links yet</h3>
            <p className="mt-2 text-sm text-zinc-400">Save your first link to build your library.</p>
          </div>
        ) : links.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {links.map((link) => {
              const linkId = link._id || link.id || "";
              const isEditing = editingId === linkId;

              if (isEditing) {
                return (
                  <div
                    key={linkId}
                    className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent"
                  >
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="text-sm text-zinc-300">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 transition-all"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300">URL</label>
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 transition-all"
                          maxLength={2048}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300">Description</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 transition-all"
                          rows={3}
                          maxLength={1000}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void saveEdit(linkId)}
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={loading}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.02] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <article
                  key={linkId}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-[0_60px_120px_-80px_rgba(34,211,238,0.7)]"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
                          <LinkIcon />
                        </div>
                        <div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white hover:text-cyan-200 transition-colors"
                          >
                            {link.title}
                            <ExternalLinkIcon />
                          </a>
                          <p className="mt-1 text-xs text-zinc-500 break-all">{link.url}</p>
                          {link.description && (
                            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-zinc-400">
                              {link.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(link)}
                          className="rounded-md p-2 text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors"
                          aria-label="Edit link"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteLink(linkId)}
                          className="rounded-md p-2 text-zinc-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          aria-label="Delete link"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
