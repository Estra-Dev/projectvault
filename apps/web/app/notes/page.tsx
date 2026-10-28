"use client";

import { useAuth } from "@digit-auth/react";
import { useCallback, useEffect, useState } from "react";

interface Project {
  _id: string;
  id?: string;
  title: string;
}

interface Note {
  _id: string;
  id?: string;
  title: string;
  content: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotesResponse {
  notes: Note[];
}

interface ProjectsResponse {
  projects: Project[];
}

interface NoteResponse {
  note: Note;
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

function NoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.83333 2.5H14.1667C15.5474 2.5 16.6667 3.61929 16.6667 5V15C16.6667 16.3807 15.5474 17.5 14.1667 17.5H5.83333C4.45262 17.5 3.33333 16.3807 3.33333 15V5C3.33333 3.61929 4.45262 2.5 5.83333 2.5Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.66667 6.66667H13.3333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.66667 10H13.3333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.66667 13.3333H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function NotesPage() {
  const { isLoading, isAuthenticated, getAccessToken } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editProjectId, setEditProjectId] = useState<string>("");
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [notesRes, projectsRes] = await Promise.all([
        requestApi<NotesResponse>("/notes"),
        requestApi<ProjectsResponse>("/projects"),
      ]);
      setNotes(notesRes.notes ?? []);
      setProjects(projectsRes.projects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [requestApi]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }
    void fetchData();
  }, [isLoading, isAuthenticated, fetchData]);

  const createNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!isAuthenticated || !trimmedTitle || !trimmedContent || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await requestApi<NoteResponse>("/notes", {
        method: "POST",
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          projectId: projectId || null,
        }),
      });

      setNotes((previous) => [
        response.note,
        ...previous.filter((note) => (note._id || note.id) !== (response.note._id || response.note.id)),
      ]);
      setTitle("");
      setContent("");
      setProjectId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (note: Note) => {
    const noteId = note._id || note.id || "";
    setEditingId(noteId);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditProjectId(note.projectId || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditProjectId("");
  };

  const saveEdit = async (noteId: string) => {
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();

    if (!trimmedTitle || !trimmedContent || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await requestApi<NoteResponse>(`/notes/${noteId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          projectId: editProjectId || null,
        }),
      });

      setNotes((previous) =>
        previous.map((note) =>
          (note._id || note.id) === noteId ? response.note : note
        )
      );
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note.");
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await requestApi(`/notes/${noteId}`, {
        method: "DELETE",
      });

      setNotes((previous) =>
        previous.filter((note) => (note._id || note.id) !== noteId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note.");
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
          <h1 className="text-3xl font-semibold tracking-tight">Notes</h1>
          <p className="mt-3 text-zinc-400">Please sign in to access your notes.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Notes</h1>
          <p className="mt-2 text-zinc-400">Capture ideas and keep context with projects</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchData()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.02] transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent w-full">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        <form onSubmit={createNote} className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
              <PlusIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Create new note</h2>
              <p className="text-sm text-zinc-400">Write and optionally link to a project</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label htmlFor="note-title" className="text-sm text-zinc-300">
                Title
              </label>
              <input
                id="note-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Meeting notes"
                aria-label="Note title"
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/40 transition-all"
                maxLength={200}
              />
            </div>
            <div>
              <label htmlFor="note-content" className="text-sm text-zinc-300">
                Content
              </label>
              <textarea
                id="note-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note..."
                aria-label="Note content"
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/40 transition-all"
                rows={6}
                maxLength={5000}
              />
            </div>
            <div>
              <label htmlFor="note-project" className="text-sm text-zinc-300">
                Project <span className="text-zinc-500">(optional)</span>
              </label>
              <select
                id="note-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/40 transition-all"
                aria-label="Associate with project"
              >
                <option value="">No project</option>
                {projects.map((project) => {
                  const pId = project._id || project.id || "";
                  return (
                    <option key={pId} value={pId}>
                      {project.title}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-[0_20px_60px_-40px_rgba(59,130,246,0.9)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <PlusIcon />
              {loading ? "Creating..." : "Create note"}
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
            <h2 className="text-xl font-semibold tracking-tight">Your notes</h2>
            <p className="mt-1 text-sm text-zinc-400">All notes visible only to you</p>
          </div>
        </div>

        {loading && notes.length === 0 ? (
          <div className="mt-6 flex items-center justify-center rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Loading notes...
            </div>
          </div>
        ) : notes.length === 0 && !error ? (
          <div className="mt-6 relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.02] text-zinc-400">
              <NoteIcon />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">No notes yet</h3>
            <p className="mt-2 text-sm text-zinc-400">Create your first note to capture ideas.</p>
          </div>
        ) : notes.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {notes.map((note) => {
              const noteId = note._id || note.id || "";
              const isEditing = editingId === noteId;

              if (isEditing) {
                return (
                  <div
                    key={noteId}
                    className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent"
                  >
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="text-sm text-zinc-300">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/40 transition-all"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300">Content</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/40 transition-all"
                          rows={6}
                          maxLength={5000}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300">Project</label>
                        <select
                          value={editProjectId}
                          onChange={(e) => setEditProjectId(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/40 transition-all"
                        >
                          <option value="">No project</option>
                          {projects.map((project) => {
                            const pId = project._id || project.id || "";
                            return (
                              <option key={pId} value={pId}>
                                {project.title}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void saveEdit(noteId)}
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
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
                  key={noteId}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-[0_60px_120px_-80px_rgba(59,130,246,0.7)]"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight">{note.title}</h3>
                        {note.projectId && (
                          <p className="mt-1 text-xs text-zinc-500">Linked to a project</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(note)}
                          className="rounded-md p-2 text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors"
                          aria-label="Edit note"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteNote(noteId)}
                          className="rounded-md p-2 text-zinc-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          aria-label="Delete note"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-400 leading-relaxed">
                      {note.content}
                    </p>
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
