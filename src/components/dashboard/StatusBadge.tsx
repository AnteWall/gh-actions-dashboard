import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Ban,
  AlertTriangle,
  CircleDashed,
  Timer,
} from "lucide-react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-all",
  {
    variants: {
      status: {
        success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        failure: "bg-red-500/20 text-red-400 border border-red-500/30",
        in_progress: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        queued: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        waiting: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
        cancelled: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
        timed_out: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
        skipped: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
        neutral: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
        pending: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        requested: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        action_required: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        stale: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
        startup_failure: "bg-red-500/20 text-red-400 border border-red-500/30",
      },
      size: {
        sm: "px-2 py-1 text-xs gap-1",
        default: "px-3 py-1.5 text-sm gap-2",
        lg: "px-4 py-2 text-base gap-2",
      },
    },
    defaultVariants: {
      status: "pending",
      size: "default",
    },
  }
);

const statusIcons = {
  success: CheckCircle2,
  failure: XCircle,
  in_progress: Loader2,
  queued: Clock,
  waiting: Timer,
  cancelled: Ban,
  timed_out: AlertTriangle,
  skipped: CircleDashed,
  neutral: CircleDashed,
  pending: Clock,
  requested: Clock,
  action_required: AlertTriangle,
  stale: CircleDashed,
  startup_failure: XCircle,
};

const statusLabels: Record<string, string> = {
  success: "Success",
  failure: "Failed",
  in_progress: "Running",
  queued: "Queued",
  waiting: "Waiting",
  cancelled: "Cancelled",
  timed_out: "Timed Out",
  skipped: "Skipped",
  neutral: "Neutral",
  pending: "Pending",
  requested: "Requested",
  action_required: "Action Required",
  stale: "Stale",
  startup_failure: "Startup Failed",
};

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

export interface StatusBadgeProps
  extends Omit<VariantProps<typeof statusBadgeVariants>, "status"> {
  status: string;
  conclusion?: string | null;
  showLabel?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  conclusion,
  showLabel = true,
  size,
  className,
}: StatusBadgeProps) {
  // Use conclusion if available and status is completed, otherwise use status
  const displayStatus =
    status === "completed" && conclusion ? conclusion : status;
  
  const Icon = statusIcons[displayStatus as keyof typeof statusIcons] || Clock;
  const label = statusLabels[displayStatus] || displayStatus;
  const isAnimated = displayStatus === "in_progress";

  return (
    <span
      className={cn(
        statusBadgeVariants({
          status: displayStatus as VariantProps<typeof statusBadgeVariants>["status"],
          size,
        }),
        className
      )}
    >
      <Icon
        className={cn("h-4 w-4", isAnimated && "animate-spin")}
        aria-hidden="true"
      />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

// Large status indicator for prominent display
export function StatusIndicator({
  status,
  conclusion,
  className,
}: {
  status: string;
  conclusion?: string | null;
  className?: string;
}) {
  const displayStatus =
    status === "completed" && conclusion ? conclusion : status;

  const colorClasses: Record<string, string> = {
    success: "bg-emerald-500 shadow-emerald-500/50",
    failure: "bg-red-500 shadow-red-500/50 animate-pulse",
    in_progress: "bg-amber-500 shadow-amber-500/50 animate-pulse",
    queued: "bg-blue-500 shadow-blue-500/50",
    waiting: "bg-purple-500 shadow-purple-500/50",
    cancelled: "bg-gray-500 shadow-gray-500/50",
    timed_out: "bg-orange-500 shadow-orange-500/50",
    pending: "bg-blue-500 shadow-blue-500/50",
  };

  return (
    <div
      className={cn(
        "h-4 w-4 rounded-full shadow-lg",
        colorClasses[displayStatus] || "bg-gray-500 shadow-gray-500/50",
        className
      )}
    />
  );
}
