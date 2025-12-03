import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { workflowRunStatus, workflowRunConclusion } from "./schema";

// Maximum number of runs to keep per repository
const MAX_RUNS_PER_REPO = 10;

// Upsert a repository - creates if not exists, updates if exists
export const upsertRepository = mutation({
    args: {
        owner: v.string(),
        name: v.string(),
        fullName: v.string(),
        avatarUrl: v.optional(v.string()),
        htmlUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("repositories")
            .withIndex("by_full_name", (q) => q.eq("fullName", args.fullName))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                owner: args.owner,
                name: args.name,
                avatarUrl: args.avatarUrl,
                htmlUrl: args.htmlUrl,
            });
            return existing._id;
        }

        return await ctx.db.insert("repositories", args);
    },
});

// Insert or update a workflow run
export const upsertWorkflowRun = mutation({
    args: {
        runId: v.number(),
        runNumber: v.number(),
        runAttempt: v.number(),
        repositoryFullName: v.string(),
        workflowId: v.number(),
        workflowName: v.string(),
        displayTitle: v.string(),
        status: workflowRunStatus,
        conclusion: v.optional(workflowRunConclusion),
        headBranch: v.string(),
        headSha: v.string(),
        event: v.string(),
        actorLogin: v.string(),
        actorAvatarUrl: v.optional(v.string()),
        createdAt: v.string(),
        updatedAt: v.string(),
        runStartedAt: v.optional(v.string()),
        htmlUrl: v.string(),
        // Repository info for upsert
        repositoryOwner: v.string(),
        repositoryName: v.string(),
        repositoryAvatarUrl: v.optional(v.string()),
        repositoryHtmlUrl: v.string(),
    },
    handler: async (ctx, args) => {
        // First, ensure the repository exists
        let repository = await ctx.db
            .query("repositories")
            .withIndex("by_full_name", (q) => q.eq("fullName", args.repositoryFullName))
            .first();

        if (!repository) {
            const repoId = await ctx.db.insert("repositories", {
                owner: args.repositoryOwner,
                name: args.repositoryName,
                fullName: args.repositoryFullName,
                avatarUrl: args.repositoryAvatarUrl,
                htmlUrl: args.repositoryHtmlUrl,
            });
            repository = await ctx.db.get(repoId);
        }

        if (!repository) {
            throw new Error("Failed to create or find repository");
        }

        // Check if this run already exists
        const existingRun = await ctx.db
            .query("workflowRuns")
            .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
            .first();

        const runData = {
            runId: args.runId,
            runNumber: args.runNumber,
            runAttempt: args.runAttempt,
            repositoryId: repository._id,
            repositoryFullName: args.repositoryFullName,
            workflowId: args.workflowId,
            workflowName: args.workflowName,
            displayTitle: args.displayTitle,
            status: args.status,
            conclusion: args.conclusion,
            headBranch: args.headBranch,
            headSha: args.headSha,
            event: args.event,
            actorLogin: args.actorLogin,
            actorAvatarUrl: args.actorAvatarUrl,
            createdAt: args.createdAt,
            updatedAt: args.updatedAt,
            runStartedAt: args.runStartedAt,
            htmlUrl: args.htmlUrl,
        };

        if (existingRun) {
            // Update existing run
            await ctx.db.patch(existingRun._id, runData);
        } else {
            // Insert new run
            await ctx.db.insert("workflowRuns", runData);

            // Cleanup old runs - keep only the last MAX_RUNS_PER_REPO per repository
            const allRuns = await ctx.db
                .query("workflowRuns")
                .withIndex("by_repository", (q) => q.eq("repositoryId", repository._id))
                .order("desc")
                .collect();

            if (allRuns.length > MAX_RUNS_PER_REPO) {
                const runsToDelete = allRuns.slice(MAX_RUNS_PER_REPO);
                for (const run of runsToDelete) {
                    await ctx.db.delete(run._id);
                }
            }
        }
    },
});

// Internal mutation for cleanup (can be scheduled)
export const cleanupOldRuns = internalMutation({
    args: {},
    handler: async (ctx) => {
        const repositories = await ctx.db.query("repositories").collect();

        for (const repo of repositories) {
            const runs = await ctx.db
                .query("workflowRuns")
                .withIndex("by_repository", (q) => q.eq("repositoryId", repo._id))
                .order("desc")
                .collect();

            if (runs.length > MAX_RUNS_PER_REPO) {
                const runsToDelete = runs.slice(MAX_RUNS_PER_REPO);
                for (const run of runsToDelete) {
                    await ctx.db.delete(run._id);
                }
            }
        }
    },
});
