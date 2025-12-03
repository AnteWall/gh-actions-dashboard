import { createFileRoute } from "@tanstack/react-router";
import { Webhooks } from "@octokit/webhooks";
import type { WorkflowRunEvent } from "@octokit/webhooks-types";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

// Initialize Convex client lazily (using VITE_ prefix for client-side access)
const getConvexClient = () => {
    const url = process.env.VITE_CONVEX_URL || import.meta.env.VITE_CONVEX_URL;
    return new ConvexHttpClient(url as string);
};

// Initialize GitHub webhooks with secret verification lazily
// Server-side env vars don't use VITE_ prefix
const getWebhooks = () => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error(
            "GITHUB_WEBHOOK_SECRET environment variable is required. Add it to your .env file."
        );
    }
    return new Webhooks({ secret });
};

export const Route = createFileRoute("/api/webhooks")({
    server: {
        handlers: {
            POST: async ({ request }: { request: Request }) => {
                const webhooks = getWebhooks();
                const convex = getConvexClient();

                try {
                    let body = await request.text();
                    let signature = request.headers.get("x-hub-signature-256") || "";
                    let event = request.headers.get("x-github-event") || "";
                    let deliveryId = request.headers.get("x-github-delivery") || "";
                    let isSmeeProxy = false;

                    // Handle smee.io wrapper - it wraps the payload in a JSON object
                    // with the original body as a string in the "body" field
                    if (body.startsWith('{"')) {
                        try {
                            const parsed = JSON.parse(body);
                            // smee.io uses "body" field for the original payload string
                            if (parsed.body && typeof parsed.body === "string") {
                                body = parsed.body;
                                isSmeeProxy = true;
                                console.log("[Webhook] Detected smee.io wrapper, extracted original payload");
                            } else if (parsed.payload && typeof parsed.payload === "string") {
                                body = parsed.payload;
                                isSmeeProxy = true;
                                console.log("[Webhook] Detected smee.io wrapper (payload field), extracted original payload");
                            }
                        } catch {
                            // Not a wrapper, continue with original body
                        }
                    }

                    console.log(
                        `[Webhook] Received ${event} event (delivery: ${deliveryId})`
                    );

                    // Verify the webhook signature (skip for smee.io in development as it can modify the payload)
                    const skipVerification = isSmeeProxy && process.env.NODE_ENV !== "production";

                    if (skipVerification) {
                        console.log("[Webhook] Skipping signature verification for smee.io proxy in development");
                    } else {
                        try {
                            const isValid = await webhooks.verify(body, signature);
                            if (!isValid) {
                                console.error("[Webhook] Invalid signature - verification returned false");
                                return new Response(
                                    JSON.stringify({ error: "Invalid signature" }),
                                    {
                                        status: 401,
                                        headers: { "Content-Type": "application/json" },
                                    }
                                );
                            }
                        } catch (verifyError) {
                            console.error("[Webhook] Signature verification error:", verifyError);
                            return new Response(
                                JSON.stringify({ error: "Signature verification failed" }),
                                {
                                    status: 401,
                                    headers: { "Content-Type": "application/json" },
                                }
                            );
                        }
                    }

                    console.log("[Webhook] Signature verified successfully");

                    // Parse the payload
                    const payload = JSON.parse(body);

                    // Handle workflow_run events
                    if (event === "workflow_run") {
                        await handleWorkflowRunEvent(payload as WorkflowRunEvent, convex);
                    }

                    return new Response(
                        JSON.stringify({ received: true, event, deliveryId }),
                        {
                            status: 200,
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                } catch (error) {
                    console.error("[Webhook] Error processing webhook:", error);
                    return new Response(
                        JSON.stringify({ error: "Internal server error" }),
                        {
                            status: 500,
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                }
            },
        },
    },
});

async function handleWorkflowRunEvent(
    event: WorkflowRunEvent,
    convex: ConvexHttpClient
) {
    const { action, workflow_run, repository } = event;

    console.log(
        `[Webhook] workflow_run.${action}: ${repository.full_name} - ${workflow_run.name} #${workflow_run.run_number}`
    );

    // Map status to our schema types
    const status = mapStatus(workflow_run.status);
    const conclusion = workflow_run.conclusion
        ? mapConclusion(workflow_run.conclusion)
        : undefined;

    try {
        await convex.mutation(api.workflowRuns.upsertWorkflowRun, {
            runId: workflow_run.id,
            runNumber: workflow_run.run_number,
            runAttempt: workflow_run.run_attempt,
            repositoryFullName: repository.full_name,
            workflowId: workflow_run.workflow_id,
            workflowName: workflow_run.name ?? "Unknown Workflow",
            displayTitle: workflow_run.display_title,
            status,
            conclusion,
            headBranch: workflow_run.head_branch ?? "unknown",
            headSha: workflow_run.head_sha,
            event: workflow_run.event,
            actorLogin: workflow_run.actor?.login ?? "unknown",
            actorAvatarUrl: workflow_run.actor?.avatar_url,
            createdAt: workflow_run.created_at,
            updatedAt: workflow_run.updated_at,
            runStartedAt: workflow_run.run_started_at,
            htmlUrl: workflow_run.html_url,
            repositoryOwner: repository.owner.login,
            repositoryName: repository.name,
            repositoryAvatarUrl: repository.owner.avatar_url,
            repositoryHtmlUrl: repository.html_url,
        });

        console.log(
            `[Webhook] Successfully stored workflow run ${workflow_run.id}`
        );
    } catch (error) {
        console.error("[Webhook] Error storing workflow run:", error);
        throw error;
    }
}

// Map GitHub status to our schema
function mapStatus(
    status: string | null
):
    | "requested"
    | "in_progress"
    | "completed"
    | "queued"
    | "waiting"
    | "pending" {
    switch (status) {
        case "requested":
            return "requested";
        case "in_progress":
            return "in_progress";
        case "completed":
            return "completed";
        case "queued":
            return "queued";
        case "waiting":
            return "waiting";
        case "pending":
            return "pending";
        default:
            return "pending";
    }
}

// Map GitHub conclusion to our schema
function mapConclusion(
    conclusion: string
):
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "timed_out"
    | "action_required"
    | "stale"
    | "skipped"
    | "startup_failure" {
    switch (conclusion) {
        case "success":
            return "success";
        case "failure":
            return "failure";
        case "neutral":
            return "neutral";
        case "cancelled":
            return "cancelled";
        case "timed_out":
            return "timed_out";
        case "action_required":
            return "action_required";
        case "stale":
            return "stale";
        case "skipped":
            return "skipped";
        case "startup_failure":
            return "startup_failure";
        default:
            return "failure";
    }
}
