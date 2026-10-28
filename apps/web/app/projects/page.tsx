"use client";

import { useAuth } from "@digit-auth/react";
import { useCallback, useEffect, useState } from "react";

interface Project {
  _id: string;
  id?: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
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

function FolderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 6.66667C2.5 5.74619 3.24619 5 4.16667 5H7.5L9.16667 6.66667H15.8333C16.7538 6.66667 17.5 7.41286 17.5 8.33333V14.1667C17.5 15.0871 16.7538 15.8333 15.8333 15.8333H4.16667C3.24619 15.8333 2.5 15.0871 2.5 14.1667V6.66667Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProjectsPage() {
  const { isLoading, isAuthenticated, getAccessToken } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
  ).replace(/\/+$/, "");

  const requestProjectsApi = useCallback(
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
          // Keep the fallback message if the response isn't JSON.
        }

        throw new Error(message);
      }

      return (await response.json()) as T;
    },
    [apiBaseUrl, getAccessToken],
  );

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await requestProjectsApi<ProjectsResponse>("/projects");
      setProjects(response.projects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, [requestProjectsApi]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }
    void fetchProjects();
  }, [isLoading, isAuthenticated, fetchProjects]);

  const createProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedTitle = title.trim();

    if (!isAuthenticated || !trimmedTitle || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await requestProjectsApi<ProjectResponse>("/projects", {
        method: "POST",
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || undefined,
        }),
      });

      const newProject = response.project;
      setProjects((previous) => [
        newProject,
        ...previous.filter((project) => (project._id || project.id) !== (newProject._id || newProject.id)),
      ]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (project: Project) => {
    const projectId = project._id || project.id || "";
    setEditingId(projectId);
    setEditTitle(project.title);
    setEditDescription(project.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const saveEdit = async (projectId: string) => {
    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await requestProjectsApi<ProjectResponse>(`/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: trimmedTitle,
          description: editDescription.trim(),
        }),
      });

      setProjects((previous) =>
        previous.map((project) =>
          (project._id || project.id) === projectId ? response.project : project
        )
      );
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await requestProjectsApi(`/projects/${projectId}`, {
        method: "DELETE",
      });

      setProjects((previous) =>
        previous.filter((project) => (project._id || project.id) !== projectId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project.");
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
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-3 text-zinc-400">Please sign in to access your projects.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Projects</h1>
          <p className="mt-2 text-zinc-400">Organize your work in a focused workspace</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchProjects()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.02] transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent w-full">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
        <form onSubmit={createProject} className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
              <PlusIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Create new project</h2>
              <p className="text-sm text-zinc-400">Add a project to keep related notes together</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="project-title" className="text-sm text-zinc-300">
                Title
              </label>
              <input
                id="project-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Product Launch"
                aria-label="Project title"
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/40 transition-all"
                maxLength={200}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="project-description" className="text-sm text-zinc-300">
                Description <span className="text-zinc-500">(optional)</span>
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context for this project..."
                aria-label="Project description"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/40 transition-all"
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-[0_20px_60px_-40px_rgba(99,102,241,0.9)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <PlusIcon />
              {loading ? "Creating..." : "Create project"}
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
            <h2 className="text-xl font-semibold tracking-tight">Your projects</h2>
            <p className="mt-1 text-sm text-zinc-400">All projects visible only to you</p>
          </div>
        </div>

        {loading && projects.length === 0 ? (
          <div className="mt-6 flex items-center justify-center rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              Loading projects...
            </div>
          </div>
        ) : projects.length === 0 && !error ? (
          <div className="mt-6 relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.02] text-zinc-400">
              <FolderIcon />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">No projects yet</h3>
            <p className="mt-2 text-sm text-zinc-400">Create your first project to get started.</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {projects.map((project) => {
              const projectId = project._id || project.id || "";
              const isEditing = editingId === projectId;

              if (isEditing) {
                return (
                  <div
                    key={projectId}
                    className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent"
                  >
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="text-sm text-zinc-300">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/40 transition-all"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300">Description</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/40 transition-all"
                          rows={3}
                          maxLength={1000}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void saveEdit(projectId)}
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
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
                  key={projectId}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:shadow-[0_60px_120px_-80px_rgba(99,102,241,0.7)]"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
                          <FolderIcon />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight">{project.title}</h3>
                          {project.description && (
                            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-zinc-400">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(project)}
                          className="rounded-md p-2 text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors"
                          aria-label="Edit project"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteProject(projectId)}
                          className="rounded-md p-2 text-zinc-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          aria-label="Delete project"
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
