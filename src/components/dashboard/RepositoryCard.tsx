import { AnimatePresence, motion } from "framer-motion";
import { Activity, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getPriorityStatus, getStatusColors } from "@/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";
import { StatusIndicator } from "./StatusBadge";
import { WorkflowGroup } from "./WorkflowGroup";

interface WorkflowData {
	workflowId: number;
	workflowName: string;
	runs: Doc<"workflowRuns">[];
}

interface RepositoryWithWorkflows {
	repository: Doc<"repositories">;
	workflows: WorkflowData[];
}

interface RepositoryCardProps {
	data: RepositoryWithWorkflows;
	variant?: "default" | "compact" | "large";
	className?: string;
}

export function RepositoryCard({
	data,
	variant = "default",
	className,
}: RepositoryCardProps) {
	const { repository, workflows } = data;

	const allRuns = useMemo(() => workflows.flatMap((w) => w.runs), [workflows]);
	const latestRun = allRuns[0];

	const hasFailure = allRuns.some(
		(r) => r.conclusion === "failure" || r.conclusion === "timed_out",
	);
	const hasInProgress = allRuns.some(
		(r) =>
			r.status === "in_progress" ||
			r.status === "queued" ||
			r.status === "waiting",
	);

	if (variant === "compact") {
		return (
			<CompactCard
				data={data}
				hasFailure={hasFailure}
				hasInProgress={hasInProgress}
				className={className}
			/>
		);
	}

	if (variant === "large") {
		return (
			<LargeCard
				data={data}
				hasFailure={hasFailure}
				hasInProgress={hasInProgress}
				className={className}
			/>
		);
	}

	return (
		<motion.div
			layout
			layoutId={`repo-${repository._id}`}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 30,
				layout: { type: "spring", stiffness: 300, damping: 30 },
			}}
		>
			<Card
				className={cn(
					"overflow-hidden transition-all duration-300 hover:shadow-lg",
					hasFailure && "ring-2 ring-red-500/50 shadow-red-500/10",
					hasInProgress &&
						!hasFailure &&
						"ring-2 ring-amber-500/50 shadow-amber-500/10",
					!hasFailure &&
						!hasInProgress &&
						latestRun?.conclusion === "success" &&
						"ring-1 ring-emerald-500/30",
					className,
				)}
			>
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-3 min-w-0">
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Avatar className="h-10 w-10 border-2 border-border">
									<AvatarImage
										src={repository.avatarUrl}
										alt={repository.owner}
									/>
									<AvatarFallback className="bg-primary/10 text-primary font-semibold">
										{repository.owner.substring(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</motion.div>
							<div className="min-w-0">
								<CardTitle className="text-lg truncate flex items-center gap-2 group">
									<a
										href={repository.htmlUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="hover:text-primary transition-colors"
									>
										{repository.name}
									</a>
									<ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
								</CardTitle>
								<CardDescription className="truncate flex items-center gap-2">
									<span>{repository.owner}</span>
									<span>•</span>
									<span className="flex items-center gap-1">
										<Activity className="h-3 w-3" />
										{workflows.length} workflow
										{workflows.length !== 1 ? "s" : ""}
									</span>
								</CardDescription>
							</div>
						</div>
						{latestRun && (
							<motion.div
								key={`${latestRun.status}-${latestRun.conclusion}`}
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ type: "spring", stiffness: 500, damping: 25 }}
							>
								<StatusIndicator
									status={latestRun.status}
									conclusion={latestRun.conclusion}
								/>
							</motion.div>
						)}
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					<AnimatePresence mode="popLayout">
						<div className="divide-y divide-border">
							{workflows.map((workflow) => (
								<WorkflowGroup key={workflow.workflowId} workflow={workflow} />
							))}
						</div>
					</AnimatePresence>

					{workflows.length === 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center py-6 text-muted-foreground"
						>
							<Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No workflow runs yet</p>
						</motion.div>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}

function CompactCard({
	data,
	hasFailure,
	hasInProgress,
	className,
}: {
	data: RepositoryWithWorkflows;
	hasFailure: boolean;
	hasInProgress: boolean;
	className?: string;
}) {
	const { repository, workflows } = data;
	const allRuns = workflows.flatMap((w) => w.runs);
	const latestRun = allRuns[0];

	return (
		<motion.div
			layout
			layoutId={`repo-compact-${repository._id}`}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 30,
				layout: { type: "spring", stiffness: 300, damping: 30 },
			}}
		>
			<Card
				className={cn(
					"overflow-hidden transition-all",
					hasFailure && "ring-2 ring-red-500/50",
					hasInProgress && !hasFailure && "ring-2 ring-amber-500/50",
					className,
				)}
			>
				<CardContent className="p-4">
					<div className="flex items-center justify-between gap-3 mb-3">
						<div className="flex items-center gap-3 min-w-0">
							<Avatar className="h-8 w-8">
								<AvatarImage
									src={repository.avatarUrl}
									alt={repository.owner}
								/>
								<AvatarFallback className="text-xs">
									{repository.owner.substring(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0">
								<p className="font-medium truncate">{repository.name}</p>
								<p className="text-xs text-muted-foreground truncate flex items-center gap-1">
									{repository.owner}
									<span>•</span>
									<span>{workflows.length} workflows</span>
								</p>
							</div>
						</div>
						{latestRun && (
							<StatusIndicator
								status={latestRun.status}
								conclusion={latestRun.conclusion}
							/>
						)}
					</div>

					<div className="divide-y divide-border">
						{workflows.map((workflow) => (
							<WorkflowGroup key={workflow.workflowId} workflow={workflow} />
						))}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

function LargeCard({
	data,
	hasFailure,
	hasInProgress,
	className,
}: {
	data: RepositoryWithWorkflows;
	hasFailure: boolean;
	hasInProgress: boolean;
	className?: string;
}) {
	const { repository, workflows } = data;
	const allRuns = workflows.flatMap((w) => w.runs);
	const latestRun = allRuns[0];

	// Get priority status and its colors for kiosk visibility
	const priorityStatus = getPriorityStatus(
		hasFailure,
		hasInProgress,
		latestRun?.conclusion,
	);
	const statusColors = getStatusColors(priorityStatus);

	return (
		<motion.div
			layout
			layoutId={`repo-large-${repository._id}`}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 30,
				layout: { type: "spring", stiffness: 300, damping: 30 },
			}}
		>
			<Card
				className={cn(
					"overflow-hidden transition-all duration-300",
					// Full background color based on status for kiosk visibility
					statusColors.bg,
					// Ring and shadow for emphasis
					"ring-4",
					statusColors.ring,
					"shadow-2xl",
					statusColors.shadow,
					// Pulse animation for failures
					hasFailure && "animate-pulse",
					className,
				)}
			>
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<motion.div
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.95 }}
							>
								<Avatar className="h-16 w-16 border-2 border-border">
									<AvatarImage
										src={repository.avatarUrl}
										alt={repository.owner}
									/>
									<AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
										{repository.owner.substring(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</motion.div>
							<div>
								<CardTitle className="text-3xl font-bold flex items-center gap-3">
									<a
										href={repository.htmlUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="hover:text-primary transition-colors"
									>
										{repository.name}
									</a>
									<ExternalLink className="h-5 w-5 text-muted-foreground" />
								</CardTitle>
								<CardDescription className="text-lg flex items-center gap-2 mt-1">
									{repository.owner}
									<span>•</span>
									<span className="flex items-center gap-1">
										<Activity className="h-5 w-5" />
										{workflows.length} workflow
										{workflows.length !== 1 ? "s" : ""}
									</span>
								</CardDescription>
							</div>
						</div>
						{latestRun && (
							<motion.div
								key={`${latestRun.status}-${latestRun.conclusion}`}
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ type: "spring", stiffness: 500, damping: 25 }}
							>
								<StatusIndicator
									status={latestRun.status}
									conclusion={latestRun.conclusion}
									size="lg"
									className="h-8 w-8"
								/>
							</motion.div>
						)}
					</div>
				</CardHeader>

				<CardContent>
					<ScrollArea className="max-h-80">
						<AnimatePresence mode="popLayout">
							<div className="divide-y divide-border/50 pr-4">
								{workflows.map((workflow) => (
									<WorkflowGroup
										key={workflow.workflowId}
										workflow={workflow}
									/>
								))}
							</div>
						</AnimatePresence>
					</ScrollArea>
				</CardContent>
			</Card>
		</motion.div>
	);
}
