import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Ban,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  stats: {
    totalRepositories: number;
    totalRuns: number;
    successCount: number;
    failureCount: number;
    inProgressCount: number;
    cancelledCount: number;
  };
  className?: string;
}

export function DashboardStats({ stats, className }: DashboardStatsProps) {
  return (
    <motion.div 
      className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
    >
      <StatCard
        label="Passing"
        value={stats.successCount}
        icon={CheckCircle2}
        variant="success"
      />
      <StatCard
        label="Failing"
        value={stats.failureCount}
        icon={XCircle}
        variant="failure"
        highlight={stats.failureCount > 0}
      />
      <StatCard
        label="In Progress"
        value={stats.inProgressCount}
        icon={stats.inProgressCount > 0 ? Loader2 : Clock}
        variant="warning"
        animate={stats.inProgressCount > 0}
      />
      <StatCard
        label="Cancelled"
        value={stats.cancelledCount}
        icon={Ban}
        variant="neutral"
      />
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant: "success" | "failure" | "warning" | "neutral";
  highlight?: boolean;
  animate?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
  highlight,
  animate,
}: StatCardProps) {
  const variantStyles = {
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    failure: "text-red-400 bg-red-500/10 border-red-500/30",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    neutral: "text-muted-foreground bg-muted/50 border-border",
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "transition-all duration-300 border",
          variantStyles[variant],
          highlight && "ring-2 ring-red-500/50 animate-pulse"
        )}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              variant === "success" && "bg-emerald-500/20",
              variant === "failure" && "bg-red-500/20",
              variant === "warning" && "bg-amber-500/20",
              variant === "neutral" && "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                animate && "animate-spin origin-center"
              )}
            />
          </div>
          <div>
            <motion.p 
              className="text-2xl font-bold"
              key={value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {value}
            </motion.p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Large stat card for TV display
export function DashboardStatsLarge({ stats, className }: DashboardStatsProps) {
  return (
    <motion.div 
      className={cn("grid grid-cols-3 gap-6", className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.15,
          },
        },
      }}
    >
      <LargeStatCard
        label="Passing"
        value={stats.successCount}
        total={stats.totalRepositories}
        icon={CheckCircle2}
        variant="success"
      />
      <LargeStatCard
        label="Failing"
        value={stats.failureCount}
        total={stats.totalRepositories}
        icon={XCircle}
        variant="failure"
        highlight={stats.failureCount > 0}
      />
      <LargeStatCard
        label="In Progress"
        value={stats.inProgressCount}
        total={stats.totalRepositories}
        icon={stats.inProgressCount > 0 ? Loader2 : Clock}
        variant="warning"
        animate={stats.inProgressCount > 0}
      />
    </motion.div>
  );
}

interface LargeStatCardProps extends StatCardProps {
  total: number;
}

function LargeStatCard({
  label,
  value,
  icon: Icon,
  variant,
  highlight,
  animate,
}: LargeStatCardProps) {
  const variantStyles = {
    success: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
    failure: "from-red-500/20 to-red-500/5 border-red-500/30",
    warning: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
    neutral: "from-muted to-background border-border",
  };

  const iconStyles = {
    success: "text-emerald-400",
    failure: "text-red-400",
    warning: "text-amber-400",
    neutral: "text-muted-foreground",
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <Card
        className={cn(
          "transition-all duration-300 border bg-gradient-to-br overflow-hidden",
          variantStyles[variant],
          highlight && "ring-4 ring-red-500/50 animate-pulse"
        )}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-shrink-0">
            <motion.div
              className="flex items-center justify-center"
              animate={animate ? { rotate: 360 } : {}}
              transition={animate ? { repeat: Infinity, duration: 1.5, ease: "linear" } : {}}
            >
              <Icon
                className={cn(
                  "h-8 w-8",
                  iconStyles[variant]
                )}
              />
            </motion.div>
          </div>
          <div className="flex-1 min-w-0">
            <motion.p 
              className="text-3xl font-bold"
              key={value}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {value}
            </motion.p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
