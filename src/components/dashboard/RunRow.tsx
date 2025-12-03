import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "./StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GitBranch, GitCommit, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

interface RunRowProps {
  run: Doc<"workflowRuns">;
  compact?: boolean;
  className?: string;
}

export function RunRow({ run, compact = false, className }: RunRowProps) {
  const timeAgo = getTimeAgo(run.updatedAt);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={run.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group",
                className
              )}
            >
              <StatusBadge
                status={run.status}
                conclusion={run.conclusion}
                showLabel={false}
                size="sm"
              />
              <span className="text-sm font-medium truncate flex-1">
                #{run.runNumber}
              </span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </a>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{run.displayTitle}</p>
              <p className="text-xs text-muted-foreground">
                {run.workflowName} • {run.headBranch}
              </p>
              <p className="text-xs text-muted-foreground">
                by {run.actorLogin} • {timeAgo}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <a
      href={run.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group border border-transparent hover:border-border",
        className
      )}
    >
      {/* Status Badge */}
      <StatusBadge
        status={run.status}
        conclusion={run.conclusion}
        showLabel={true}
        size="default"
      />

      {/* Run Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            #{run.runNumber}
          </span>
          <span className="text-muted-foreground truncate">
            {run.displayTitle}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {run.headBranch}
          </span>
          <span className="flex items-center gap-1">
            <GitCommit className="h-3 w-3" />
            {run.headSha.substring(0, 7)}
          </span>
          <span>{run.event}</span>
        </div>
      </div>

      {/* Actor */}
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={run.actorAvatarUrl} alt={run.actorLogin} />
          <AvatarFallback className="text-xs">
            {run.actorLogin.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {run.actorLogin}
        </span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{timeAgo}</span>
        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}

// Mini run indicator for compact views
export function RunIndicator({
  run,
  className,
}: {
  run: Doc<"workflowRuns">;
  className?: string;
}) {
  const displayStatus =
    run.status === "completed" && run.conclusion ? run.conclusion : run.status;

  const colorClasses: Record<string, string> = {
    success: "bg-emerald-500",
    failure: "bg-red-500",
    in_progress: "bg-amber-500 animate-pulse",
    queued: "bg-blue-500",
    waiting: "bg-purple-500",
    cancelled: "bg-gray-500",
    timed_out: "bg-orange-500",
    pending: "bg-blue-500",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={run.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "h-3 w-3 rounded-full transition-transform hover:scale-125",
              colorClasses[displayStatus] || "bg-gray-500",
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">#{run.runNumber}</p>
            <p className="text-muted-foreground">{run.displayTitle}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
