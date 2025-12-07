import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { ViewModeProvider } from "@/components/context";
import {
	DashboardGridSkeleton,
	DashboardStats,
	DashboardStatsLarge,
	RepositoryCard,
} from "@/components/dashboard";
import { Header } from "@/components/layout";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({
	component: Dashboard,
	validateSearch: (search: Record<string, unknown>) => ({
		kiosk: search.kiosk === true || search.kiosk === "true",
	}),
});

function Dashboard() {
	const { kiosk: isKioskMode } = useSearch({ from: "/" });
	const [viewMode, setViewMode] = useState<"grid" | "tv">(
		isKioskMode ? "tv" : "tv",
	);

	// Sync viewMode with kiosk param
	useEffect(() => {
		if (isKioskMode) {
			setViewMode("tv");
		}
	}, [isKioskMode]);

	return (
		<ViewModeProvider viewMode={viewMode} isKioskMode={isKioskMode}>
			<div className="min-h-screen bg-background">
				{/* Header with auto-hide in TV/kiosk mode */}
				<Header
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					isKioskMode={isKioskMode}
				/>

				{/* Main Content */}
				<main
					className={
						viewMode === "tv" ? "px-6 py-6" : "container mx-auto px-4 py-6"
					}
				>
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
		</ViewModeProvider>
	);
}

function GridView() {
	const { data: repositories } = useSuspenseQuery(
		convexQuery(api.queries.listRepositoriesWithRuns, {}),
	);
	const { data: stats } = useSuspenseQuery(
		convexQuery(api.queries.getDashboardStats, {}),
	);

	// Sort: in-progress first, then failures, then by most recent activity
	const sortedRepos = [...repositories].sort((a, b) => {
		const aRuns = a.workflows.flatMap((w) => w.runs);
		const bRuns = b.workflows.flatMap((w) => w.runs);

		const aInProgress = aRuns.some(
			(r) =>
				r.status === "in_progress" ||
				r.status === "queued" ||
				r.status === "waiting",
		);
		const bInProgress = bRuns.some(
			(r) =>
				r.status === "in_progress" ||
				r.status === "queued" ||
				r.status === "waiting",
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
							<RepositoryCard
								key={repo.repository._id}
								data={repo}
								variant="default"
							/>
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
		convexQuery(api.queries.listRepositoriesWithRuns, {}),
	);
	const { data: stats } = useSuspenseQuery(
		convexQuery(api.queries.getDashboardStats, {}),
	);

	// Sort: in-progress first, then failures, then by most recent activity
	const sortedRepos = [...repositories].sort((a, b) => {
		const aRuns = a.workflows.flatMap((w) => w.runs);
		const bRuns = b.workflows.flatMap((w) => w.runs);

		const aInProgress = aRuns.some(
			(r) =>
				r.status === "in_progress" ||
				r.status === "queued" ||
				r.status === "waiting",
		);
		const bInProgress = bRuns.some(
			(r) =>
				r.status === "in_progress" ||
				r.status === "queued" ||
				r.status === "waiting",
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
							<RepositoryCard
								key={repo.repository._id}
								data={repo}
								variant="large"
							/>
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
					<li>1. Go to your GitHub repository → Settings → Webhooks</li>
					<li>
						2. Add webhook URL:{" "}
						<code className="bg-background px-1 rounded">
							https://your-domain/api/webhooks
						</code>
					</li>
					<li>
						3. Set content type to{" "}
						<code className="bg-background px-1 rounded">application/json</code>
					</li>
					<li>4. Select "Workflow runs" event</li>
					<li>
						5. Add your webhook secret to{" "}
						<code className="bg-background px-1 rounded">
							GITHUB_WEBHOOK_SECRET
						</code>
					</li>
				</ol>
			</div>
		</div>
	);
}
