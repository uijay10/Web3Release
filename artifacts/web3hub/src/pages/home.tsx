import { useState, useEffect, useRef, useCallback } from "react";
import { useGetProjects, useGetPinnedProjects } from "@workspace/api-client-react";
import { ProjectCard } from "@/components/project-card";
import { Search } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";

export default function Home() {
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setAllProjects([]);
  }, [debouncedSearch]);

  const { data: pinnedData } = useGetPinnedProjects();
  const { data: projectsData, isLoading } = useGetProjects({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  });

  useEffect(() => {
    if (projectsData?.projects) {
      if (page === 1) setAllProjects(projectsData.projects);
      else setAllProjects((prev) => [...prev, ...projectsData.projects]);
    }
  }, [projectsData, page]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && projectsData && page < projectsData.totalPages) {
      setPage((p) => p + 1);
    }
  }, [projectsData, page]);

  useEffect(() => {
    const obs = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [handleObserver]);

  const hasPinned = pinnedData && pinnedData.length > 0;
  const hasProjects = allProjects.length > 0;

  return (
    <div className="space-y-8 pb-4">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">Web3Hub</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("tagline")}</p>
        </div>
        <Link
          href="/apply"
          className="shrink-0 inline-flex items-center gap-1 px-5 py-2 rounded-full text-sm font-bold bg-[#FF69B4] text-white hover:bg-[#ff4fa8] shadow-sm hover:shadow transition-all"
        >
          {t("register")}
        </Link>
      </div>

      {/* ── Search ──────────────────────────────────────── */}
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects by name, keyword..."
          className="w-full pl-11 pr-4 py-2.5 rounded-full border border-border bg-muted/40 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
        />
      </div>

      {/* ── Pinned Zone ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("pinned")}</h2>
          <span className="w-2 h-2 rounded-full bg-[#00FF9F] shadow-[0_0_8px_#00FF9F] animate-pulse" />
        </div>

        {hasPinned ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pinnedData.map((project) => (
              <ProjectCard key={project.id} project={project} isPinned />
            ))}
          </div>
        ) : (
          /* Empty placeholder: 10 shimmering square cells */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl border border-dashed bg-muted/10 shimmer-cell"
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Regular Zone ────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("regular")}</h2>
          {hasProjects && (
            <span className="text-xs text-muted-foreground">{t("total")} {projectsData?.total ?? 0} {t("projects")}</span>
          )}
        </div>

        {!hasProjects && !isLoading ? (
          /* Empty state: 20 cells, 2 cols × 10 rows */
          <div>
            <p className="text-center text-sm text-muted-foreground mb-4">
              {t("encouragement")}
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl border border-dashed bg-muted/10 shimmer-cell" />
              ))}
            </div>
          </div>
        ) : (
          /* 2 columns × N rows */
          <div className="grid grid-cols-2 gap-3">
            {isLoading && page === 1
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                ))
              : allProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} compact />
                ))
            }
          </div>
        )}

        <div ref={loaderRef} className="h-4" />
        {isLoading && page > 1 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </section>
    </div>
  );
}
