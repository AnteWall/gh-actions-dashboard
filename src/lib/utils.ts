import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type StatusType =
    | "success"
    | "failure"
    | "in_progress"
    | "queued"
    | "waiting"
    | "cancelled"
    | "timed_out"
    | "skipped"
    | "neutral"
    | "pending"
    | "requested"
    | "action_required"
    | "stale"
    | "startup_failure";

export interface StatusColors {
    bg: string;
    bgSolid: string;
    ring: string;
    text: string;
    shadow: string;
}

/**
 * Get consistent status-based colors for UI elements
 * Used for kiosk/TV mode card backgrounds and other status displays
 */
export function getStatusColors(status: StatusType | string): StatusColors {
    const colors: Record<string, StatusColors> = {
        success: {
            bg: "bg-emerald-500/20",
            bgSolid: "bg-emerald-500",
            ring: "ring-emerald-500/50",
            text: "text-emerald-400",
            shadow: "shadow-emerald-500/20",
        },
        failure: {
            bg: "bg-red-500/25",
            bgSolid: "bg-red-500",
            ring: "ring-red-500/60",
            text: "text-red-400",
            shadow: "shadow-red-500/30",
        },
        startup_failure: {
            bg: "bg-red-500/25",
            bgSolid: "bg-red-500",
            ring: "ring-red-500/60",
            text: "text-red-400",
            shadow: "shadow-red-500/30",
        },
        in_progress: {
            bg: "bg-amber-500/20",
            bgSolid: "bg-amber-500",
            ring: "ring-amber-500/50",
            text: "text-amber-400",
            shadow: "shadow-amber-500/20",
        },
        queued: {
            bg: "bg-blue-500/20",
            bgSolid: "bg-blue-500",
            ring: "ring-blue-500/50",
            text: "text-blue-400",
            shadow: "shadow-blue-500/20",
        },
        waiting: {
            bg: "bg-purple-500/20",
            bgSolid: "bg-purple-500",
            ring: "ring-purple-500/50",
            text: "text-purple-400",
            shadow: "shadow-purple-500/20",
        },
        cancelled: {
            bg: "bg-gray-500/20",
            bgSolid: "bg-gray-500",
            ring: "ring-gray-500/50",
            text: "text-gray-400",
            shadow: "shadow-gray-500/20",
        },
        timed_out: {
            bg: "bg-orange-500/20",
            bgSolid: "bg-orange-500",
            ring: "ring-orange-500/50",
            text: "text-orange-400",
            shadow: "shadow-orange-500/20",
        },
        skipped: {
            bg: "bg-slate-500/20",
            bgSolid: "bg-slate-500",
            ring: "ring-slate-500/50",
            text: "text-slate-400",
            shadow: "shadow-slate-500/20",
        },
        neutral: {
            bg: "bg-slate-500/20",
            bgSolid: "bg-slate-500",
            ring: "ring-slate-500/50",
            text: "text-slate-400",
            shadow: "shadow-slate-500/20",
        },
        pending: {
            bg: "bg-blue-500/20",
            bgSolid: "bg-blue-500",
            ring: "ring-blue-500/50",
            text: "text-blue-400",
            shadow: "shadow-blue-500/20",
        },
        requested: {
            bg: "bg-blue-500/20",
            bgSolid: "bg-blue-500",
            ring: "ring-blue-500/50",
            text: "text-blue-400",
            shadow: "shadow-blue-500/20",
        },
        action_required: {
            bg: "bg-yellow-500/20",
            bgSolid: "bg-yellow-500",
            ring: "ring-yellow-500/50",
            text: "text-yellow-400",
            shadow: "shadow-yellow-500/20",
        },
        stale: {
            bg: "bg-gray-500/20",
            bgSolid: "bg-gray-500",
            ring: "ring-gray-500/50",
            text: "text-gray-400",
            shadow: "shadow-gray-500/20",
        },
    };

    return colors[status] || colors.pending;
}

/**
 * Determine the priority status from a set of runs
 * Priority: failure > in_progress > success
 */
export function getPriorityStatus(
    hasFailure: boolean,
    hasInProgress: boolean,
    latestConclusion?: string | null,
): StatusType {
    if (hasFailure) return "failure";
    if (hasInProgress) return "in_progress";
    if (latestConclusion === "success") return "success";
    return "pending";
}
