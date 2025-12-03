import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import {
  RepositoryCard,
  DashboardStats,
  DashboardStatsLarge,
  DashboardGridSkeleton,
} from "@/components/dashboard";
import { Github, Monitor, Tv, RefreshCw } from "lucide-react";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "tv">("tv");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2 rounded-lg bg-primary/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="h-6 w-6 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold">GitHub Actions Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time CI/CD status monitor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                <motion.button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                  title="Grid View"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Monitor className="h-4 w-4" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode("tv")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "tv"
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                  title="TV Display Mode"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Tv className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Live indicator */}
              <motion.div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-400">
                  Live
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={viewMode === "tv" ? "px-6 py-6" : "container mx-auto px-4 py-6"}>
        <Suspense fallback={<DashboardGridSkeleton />}>
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <GridView />
              </motion.div>
            ) : (
              <motion.div
                key="tv"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TVView />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
}

function GridView() {
  const { data: repositories } = useSuspenseQuery(
    convexQuery(api.queries.listRepositoriesWithRuns, {})
  );
  const { data: stats } = useSuspenseQuery(
    convexQuery(api.queries.getDashboardStats, {})
  );

  // Sort: in-progress first, then failures, then by most recent activity
  const sortedRepos = [...repositories].sort((a, b) => {
    const aRuns = a.workflows.flatMap((w) => w.runs);
    const bRuns = b.workflows.flatMap((w) => w.runs);
    
    const aInProgress = aRuns.some(
      (r) =>
        r.status === "in_progress" ||
        r.status === "queued" ||
        r.status === "waiting"
    );
    const bInProgress = bRuns.some(
      (r) =>
        r.status === "in_progress" ||
        r.status === "queued" ||
        r.status === "waiting"
    );
    if (aInProgress && !bInProgress) return -1;
    if (!aInProgress && bInProgress) return 1;

    const aHasFailure = aRuns.some((r) => r.conclusion === "failure");
    const bHasFailure = bRuns.some((r) => r.conclusion === "failure");
    if (aHasFailure && !bHasFailure) return -1;
    if (!aHasFailure && bHasFailure) return 1;

    // Finally sort by most recent run
    const aLatest = a.workflows[0]?.runs[0]?.updatedAt ?? "";
    const bLatest = b.workflows[0]?.runs[0]?.updatedAt ?? "";
    return bLatest.localeCompare(aLatest);
  });

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <DashboardStats stats={stats} />

      {/* Repository Grid */}
      {sortedRepos.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {sortedRepos.map((repo) => (
              <RepositoryCard key={repo.repository._id} data={repo} variant="default" />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function TVView() {
  const { data: repositories } = useSuspenseQuery(
    convexQuery(api.queries.listRepositoriesWithRuns, {})
  );
  const { data: stats } = useSuspenseQuery(
    convexQuery(api.queries.getDashboardStats, {})
  );

  // Sort: in-progress first, then failures, then by most recent activity
  const sortedRepos = [...repositories].sort((a, b) => {
    const aRuns = a.workflows.flatMap((w) => w.runs);
    const bRuns = b.workflows.flatMap((w) => w.runs);
    
    const aInProgress = aRuns.some(
      (r) =>
        r.status === "in_progress" ||
        r.status === "queued" ||
        r.status === "waiting"
    );
    const bInProgress = bRuns.some(
      (r) =>
        r.status === "in_progress" ||
        r.status === "queued" ||
        r.status === "waiting"
    );
    if (aInProgress && !bInProgress) return -1;
    if (!aInProgress && bInProgress) return 1;

    const aHasFailure = aRuns.some((r) => r.conclusion === "failure");
    const bHasFailure = bRuns.some((r) => r.conclusion === "failure");
    if (aHasFailure && !bHasFailure) return -1;
    if (!aHasFailure && bHasFailure) return 1;

    // Finally sort by most recent run
    const aLatest = a.workflows[0]?.runs[0]?.updatedAt ?? "";
    const bLatest = b.workflows[0]?.runs[0]?.updatedAt ?? "";
    return bLatest.localeCompare(aLatest);
  });

  return (
    <div className="space-y-8">
      {/* Large Stats for TV */}
      <DashboardStatsLarge stats={stats} />

      {/* Large Repository Cards */}
      {sortedRepos.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {sortedRepos.map((repo) => (
              <RepositoryCard key={repo.repository._id} data={repo} variant="large" />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="p-4 rounded-full bg-muted mb-6">
        <RefreshCw className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">No repositories yet</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Configure your GitHub webhook to start receiving workflow run events.
        Once configured, your repositories will appear here automatically.
      </p>
      <div className="p-4 rounded-lg bg-muted/50 border max-w-lg">
        <h3 className="font-semibold mb-2">Quick Setup</h3>
        <ol className="text-sm text-muted-foreground text-left space-y-2">
          <li>
            1. Go to your GitHub repository → Settings → Webhooks
          </li>
          <li>
            2. Add webhook URL:{" "}
            <code className="bg-background px-1 rounded">
              https://your-domain/api/webhooks
            </code>
          </li>
          <li>
            3. Set content type to <code className="bg-background px-1 rounded">application/json</code>
          </li>
          <li>
            4. Select "Workflow runs" event
          </li>
          <li>
            5. Add your webhook secret to{" "}
            <code className="bg-background px-1 rounded">GITHUB_WEBHOOK_SECRET</code>
          </li>
        </ol>
      </div>
    </div>
  );
}
