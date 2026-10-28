"use client";

import { useAuth } from "@digit-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="2" width="6" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="8" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.25 5.25L9 2.25L15.75 5.25V12.75L9 15.75L2.25 12.75V5.25Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 2.25V15.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.25 5.25L15.75 12.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M15.75 5.25L2.25 12.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.25 2.25H12.75C13.9926 2.25 15 3.25736 15 4.5V13.5C15 14.7426 13.9926 15.75 12.75 15.75H5.25C4.00736 15.75 3 14.7426 3 13.5V4.5C3 3.25736 4.00736 2.25 5.25 2.25Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 6H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 9H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 12H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function LinksIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 10.5L10.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8.25 6L9.375 4.875C10.4105 3.83947 12.0895 3.83947 13.125 4.875C14.1605 5.91053 14.1605 7.58947 13.125 8.625L12 9.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.75 12L8.625 13.125C7.58947 14.1605 5.91053 14.1605 4.875 13.125C3.83947 12.0895 3.83947 10.4105 4.875 9.375L6 8.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5.25H15M3 9H15M3 12.75H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/projects", label: "Projects", icon: <ProjectsIcon /> },
  { href: "/notes", label: "Notes", icon: <NotesIcon /> },
  { href: "/links", label: "Links", icon: <LinksIcon /> },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b1026] text-white">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          Checking your session...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const getPageTitle = () => {
    if (pathname?.startsWith("/dashboard")) return "Dashboard";
    if (pathname?.startsWith("/projects")) return "Projects";
    if (pathname?.startsWith("/notes")) return "Notes";
    if (pathname?.startsWith("/links")) return "Links";
    return "ProjectVault";
  };

  return (
    <div className="min-h-screen text-white">
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:left-0 border-r border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-xl">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400 shadow-[0_0_0_6px_rgba(99,102,241,0.08)]" />
            <span className="text-base font-semibold tracking-tight">ProjectVault</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <span className={isActive ? "text-indigo-300" : "text-zinc-500 group-hover:text-zinc-300"}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/80 to-blue-400/80 text-sm font-medium text-white">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs text-zinc-500">Signed in</p>
            </div>
            <button
              onClick={() => void logout()}
              className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72 min-h-screen flex flex-col w-full">
        <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0b1026]/80 backdrop-blur-xl w-full">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden rounded-md p-2 text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                aria-label="Open navigation"
              >
                <MenuIcon />
              </button>
              <div>
                <h1 className="text-sm font-medium text-white">{getPageTitle()}</h1>
                <p className="text-xs text-zinc-500">ProjectVault Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-xs text-zinc-500 truncate max-w-[200px]">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/5 bg-[#0b1026]/95 backdrop-blur-xl flex flex-col">
              <div className="flex h-16 items-center justify-between px-6">
                <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400" />
                  <span className="text-base font-semibold tracking-tight">ProjectVault</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-2 text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                  aria-label="Close navigation"
                >
                  <CloseIcon />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/10 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                      }`}
                    >
                      <span className={isActive ? "text-indigo-300" : "text-zinc-500 group-hover:text-zinc-300"}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-white/5 p-4">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    void logout();
                  }}
                  className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
