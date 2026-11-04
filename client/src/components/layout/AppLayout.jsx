
import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import {
  Search,
  Sun,
  Moon,
  UserRound,
  Command,
  Menu,
  ShieldCheck,
  LogOut,
  FileCode,
  Bug,
  LoaderCircle,
  X,
} from "lucide-react";

import Sidebar from "./Sidebar";
import { useUIStore } from "../../stores/useUIStore";
import useAuthStore from "../../stores/useAuthStore";
import api from "../../lib/axios";

export default function AppLayout({ children }) {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const toggleMobileSidebar = useUIStore(
    (state) => state.toggleMobileSidebar
  );

  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    scans: [],
    findings: [],
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const searchRef = useRef(null);
  const searchContainerRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );
  }, [theme]);

  
  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults({ scans: [], findings: [] });
      setLoading(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError("");

        const response = await api.get("/scans/search", {
          params: { q: trimmedQuery },
          signal: controller.signal,
        });

        setResults({
          scans: response.data.scans || [],
          findings: response.data.findings || [],
        });
      } catch (error) {
        if (error.name !== "CanceledError") {
          console.error("Search failed:", error);
          setSearchError("Unable to perform search. Please try again.");
          setResults({ scans: [], findings: [] });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  
  useEffect(() => {
    const handleKeyboardShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        searchRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut);
    };
  }, []);

  
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const openScan = (scanId) => {
    if (!scanId) return;

    setSearchOpen(false);
    setQuery("");
    navigate(`/scans/${scanId}`);
  };

  const hasResults =
    results.scans.length > 0 || results.findings.length > 0;

  return (
    <div className="flex min-h-screen bg-[var(--app-bg)]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-header sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">

            {}
            <button
              onClick={toggleMobileSidebar}
              className="rounded-xl p-2 text-secondary transition hover:bg-[var(--surface-soft)] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu size={21} />
            </button>

            <div className="hidden items-center gap-2 text-sm font-semibold text-primary md:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <ShieldCheck size={16} />
              </span>
              <span>Security Workspace</span>
            </div>

            {}
            <div
              ref={searchContainerRef}
              className="relative w-full max-w-[390px]"
            >
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />

              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search scans, vulnerabilities..."
                className="input-surface h-10 w-full rounded-xl pl-9 pr-14 text-xs placeholder:text-muted"
                autoComplete="off"
                aria-label="Search scans and vulnerabilities"
                aria-expanded={searchOpen}
              />

              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(true);
                    searchRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-primary"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : (
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-subtle bg-[var(--surface)] px-1.5 py-1 text-[10px] text-muted">
                  <Command size={10} />
                  K
                </div>
              )}

              {}
              {searchOpen && (
                <div className="absolute left-0 top-[calc(100%+10px)] z-50 max-h-[420px] w-full min-w-[300px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl sm:min-w-[390px]">

                  {query.trim().length < 2 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted">
                      Type at least 2 characters to search.
                    </p>
                  ) : loading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted">
                      <LoaderCircle size={16} className="animate-spin" />
                      Searching...
                    </div>
                  ) : searchError ? (
                    <p className="px-3 py-4 text-center text-xs text-red-500">
                      {searchError}
                    </p>
                  ) : !hasResults ? (
                    <div className="py-6 text-center">
                      <Search size={22} className="mx-auto mb-2 text-muted" />
                      <p className="text-xs font-medium text-primary">
                        No results found
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        Try a different search term.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">

                      {}
                      {results.scans.length > 0 && (
                        <section>
                          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                            Scans
                          </p>

                          {results.scans.map((scan) => (
                            <button
                              key={scan._id}
                              type="button"
                              onClick={() => openScan(scan._id)}
                              className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-[var(--surface-soft)]"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                                <FileCode size={16} />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-primary">
                                  {scan.name}
                                </span>
                                <span className="mt-1 block truncate text-[10px] text-muted">
                                  {scan.fileName || scan.language} · {scan.status}
                                </span>
                              </span>
                            </button>
                          ))}
                        </section>
                      )}

                      {}
                      {results.findings.length > 0 && (
                        <section>
                          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                            Vulnerabilities
                          </p>

                          {results.findings.map((finding) => (
                            <button
                              key={finding._id}
                              type="button"
                              onClick={() => openScan(finding.scan?._id)}
                              disabled={!finding.scan?._id}
                              className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-[var(--surface-soft)] disabled:opacity-50"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                                <Bug size={16} />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-primary">
                                  {finding.title}
                                </span>
                                <span className="mt-1 block truncate text-[10px] text-muted">
                                  {finding.ruleId} · {finding.severity}
                                  {finding.scan?.name
                                    ? ` · ${finding.scan.name}`
                                    : ""}
                                </span>
                              </span>
                            </button>
                          ))}
                        </section>
                      )}

                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">

            {}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              className="rounded-xl p-2.5 text-secondary transition hover:bg-[var(--surface-soft)] hover:text-primary"
            >
              {theme === "light" ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </button>


            <div className="hidden h-7 w-px bg-[var(--border)] sm:block" />

            {}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-text)]">
                <UserRound size={18} />
              </div>

              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-primary">
                  {user?.name || "User"}
                </p>

                <p className="mt-0.5 max-w-[150px] truncate text-[10px] text-muted">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            {}
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-secondary transition hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut size={18} />
              <span className="hidden text-xs font-medium sm:block">
                Logout
              </span>
            </button>

          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
