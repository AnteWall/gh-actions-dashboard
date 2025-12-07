import { motion } from "framer-motion";
import { Clock, ExternalLink, GitBranch } from "lucide-react";
import { useViewMode } from "@/components/context";
import type { Doc } from "../../../convex/_generated/dataModel";
import { RunIndicator } from "./RunRow";
import { StatusBadge } from "./StatusBadge";

interface WorkflowGroupProps {
	workflow: {
		workflowId: number;
		workflowName: string;
		runs: Doc<"workflowRuns">[];
	};
}

export function WorkflowGroup({ workflow }: WorkflowGroupProps) {
	const latestRun = workflow.runs[0];
	const { viewMode } = useViewMode();

	if (!latestRun) return null;

	// Use larger indicator size in TV mode
	const indicatorSize = viewMode === "tv" ? "lg" : "default";

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className="py-3"
		>
			<div className="flex items-center justify-between gap-4">
				{/* Left side: Workflow info */}
				<div className="flex items-center gap-3 min-w-0 flex-1">
					<StatusBadge
						status={latestRun.status}
						conclusion={latestRun.conclusion}
						showLabel={false}
						size={viewMode === "tv" ? "lg" : "default"}
					/>
					<div className="min-w-0 flex-1">
						<a
							href={latestRun.htmlUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium truncate block hover:text-primary transition-colors group flex items-center gap-1.5"
						>
							{workflow.workflowName}
							<ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
						</a>
						<div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
							<span className="flex items-center gap-1">
								<GitBranch className="h-3 w-3" />
								{latestRun.headBranch}
							</span>
							<span className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								{getTimeAgo(latestRun.updatedAt)}
							</span>
							<span>#{latestRun.runNumber}</span>
						</div>
					</div>
				</div>

				{/* Right side: Run history dots */}
				<div className="flex items-center gap-1.5">
					{workflow.runs.slice(0, 10).map((run) => (
						<RunIndicator key={run._id} run={run} size={indicatorSize} />
					))}
				</div>
			</div>
		</motion.div>
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
