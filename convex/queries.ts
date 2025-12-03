import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all repositories with their latest workflow runs grouped by workflow
export const listRepositoriesWithRuns = query({
    args: {},
    handler: async (ctx) => {
        const repositories = await ctx.db.query("repositories").collect();

        const repositoriesWithRuns = await Promise.all(
            repositories.map(async (repo) => {
                const runs = await ctx.db
                    .query("workflowRuns")
                    .withIndex("by_repository", (q) => q.eq("repositoryId", repo._id))
                    .order("desc")
                    .take(50); // Get more runs to group by workflow

                // Group runs by workflow
                const workflowMap = new Map<number, {
                    workflowId: number;
                    workflowName: string;
                    runs: typeof runs;
                }>();

                for (const run of runs) {
                    const existing = workflowMap.get(run.workflowId);
                    if (existing) {
                        // Keep only last 10 runs per workflow
                        if (existing.runs.length < 10) {
                            existing.runs.push(run);
                        }
                    } else {
                        workflowMap.set(run.workflowId, {
                            workflowId: run.workflowId,
                            workflowName: run.workflowName,
                            runs: [run],
                        });
                    }
                }

                const workflows = Array.from(workflowMap.values()).sort((a, b) => {
                    // Sort by most recent run
                    const aLatest = a.runs[0]?.updatedAt ?? "";
                    const bLatest = b.runs[0]?.updatedAt ?? "";
                    return bLatest.localeCompare(aLatest);
                });

                return {
                    repository: repo,
                    workflows,
                };
            })
        );

        // Sort by most recent activity
        return repositoriesWithRuns.sort((a, b) => {
            const aLatest = a.workflows[0]?.runs[0]?.updatedAt ?? "";
            const bLatest = b.workflows[0]?.runs[0]?.updatedAt ?? "";
            return bLatest.localeCompare(aLatest);
        });
    },
});

// Get a single repository with its runs
export const getRepositoryWithRuns = query({
    args: {
        fullName: v.string(),
    },
    handler: async (ctx, args) => {
        const repository = await ctx.db
            .query("repositories")
            .withIndex("by_full_name", (q) => q.eq("fullName", args.fullName))
            .first();

        if (!repository) {
            return null;
        }

        const runs = await ctx.db
            .query("workflowRuns")
            .withIndex("by_repository", (q) => q.eq("repositoryId", repository._id))
            .order("desc")
            .take(10);

        return {
            ...repository,
            runs,
        };
    },
});

// Get dashboard summary stats
export const getDashboardStats = query({
    args: {},
    handler: async (ctx) => {
        const allRuns = await ctx.db.query("workflowRuns").collect();
        const repositories = await ctx.db.query("repositories").collect();

        // Get the latest run per repository to determine current status
        const latestRunsByRepo = new Map<string, (typeof allRuns)[0]>();
        for (const run of allRuns) {
            const existing = latestRunsByRepo.get(run.repositoryFullName);
            if (!existing || run.updatedAt > existing.updatedAt) {
                latestRunsByRepo.set(run.repositoryFullName, run);
            }
        }

        const latestRuns = Array.from(latestRunsByRepo.values());

        const stats = {
            totalRepositories: repositories.length,
            totalRuns: allRuns.length,
            successCount: latestRuns.filter((r) => r.conclusion === "success").length,
            failureCount: latestRuns.filter((r) => r.conclusion === "failure").length,
            inProgressCount: latestRuns.filter(
                (r) => r.status === "in_progress" || r.status === "queued" || r.status === "waiting"
            ).length,
            cancelledCount: latestRuns.filter((r) => r.conclusion === "cancelled").length,
        };

        return stats;
    },
});

// Get runs that are currently in progress
export const getInProgressRuns = query({
    args: {},
    handler: async (ctx) => {
        const inProgressRuns = await ctx.db
            .query("workflowRuns")
            .withIndex("by_status", (q) => q.eq("status", "in_progress"))
            .collect();

        const queuedRuns = await ctx.db
            .query("workflowRuns")
            .withIndex("by_status", (q) => q.eq("status", "queued"))
            .collect();

        const waitingRuns = await ctx.db
            .query("workflowRuns")
            .withIndex("by_status", (q) => q.eq("status", "waiting"))
            .collect();

        return [...inProgressRuns, ...queuedRuns, ...waitingRuns].sort(
            (a, b) => b.updatedAt.localeCompare(a.updatedAt)
        );
    },
});
