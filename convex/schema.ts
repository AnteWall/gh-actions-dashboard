import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// GitHub Actions Dashboard Schema
export const workflowRunStatus = v.union(
  v.literal("requested"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("queued"),
  v.literal("waiting"),
  v.literal("pending")
);

export const workflowRunConclusion = v.union(
  v.literal("success"),
  v.literal("failure"),
  v.literal("neutral"),
  v.literal("cancelled"),
  v.literal("timed_out"),
  v.literal("action_required"),
  v.literal("stale"),
  v.literal("skipped"),
  v.literal("startup_failure")
);

export default defineSchema({
  // Store repository information
  repositories: defineTable({
    owner: v.string(),
    name: v.string(),
    fullName: v.string(), // "owner/repo"
    avatarUrl: v.optional(v.string()),
    htmlUrl: v.string(),
  }).index("by_full_name", ["fullName"]),

  // Store workflow run information
  workflowRuns: defineTable({
    // GitHub identifiers
    runId: v.number(), // GitHub's workflow run ID
    runNumber: v.number(),
    runAttempt: v.number(),

    // Repository reference
    repositoryId: v.id("repositories"),
    repositoryFullName: v.string(), // Denormalized for easier queries

    // Workflow info
    workflowId: v.number(),
    workflowName: v.string(),
    displayTitle: v.string(),

    // Status
    status: workflowRunStatus,
    conclusion: v.optional(workflowRunConclusion),

    // Branch and commit info
    headBranch: v.string(),
    headSha: v.string(),
    event: v.string(), // "push", "pull_request", etc.

    // Actor info
    actorLogin: v.string(),
    actorAvatarUrl: v.optional(v.string()),

    // Timestamps (stored as ISO strings from GitHub)
    createdAt: v.string(),
    updatedAt: v.string(),
    runStartedAt: v.optional(v.string()),

    // URL to view on GitHub
    htmlUrl: v.string(),
  })
    .index("by_repository", ["repositoryId"])
    .index("by_repository_full_name", ["repositoryFullName"])
    .index("by_run_id", ["runId"])
    .index("by_status", ["status"]),
});
