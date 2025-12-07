import { motion } from "framer-motion";
import { Github, Maximize2, Minimize2, Monitor, Tv } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
	viewMode: "grid" | "tv";
	onViewModeChange: (mode: "grid" | "tv") => void;
	isKioskMode?: boolean;
	className?: string;
}

// Header height constant for consistent spacing
const HEADER_HEIGHT = 73; // px - matches the actual header height

/**
 * Custom hook for fullscreen API
 */
function useFullscreen() {
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
		};
	}, []);

	const toggleFullscreen = useCallback(async () => {
		try {
			if (!document.fullscreenElement) {
				await document.documentElement.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		} catch (error) {
			console.error("Fullscreen error:", error);
		}
	}, []);

	return { isFullscreen, toggleFullscreen };
}

/**
 * Custom hook for auto-hide header behavior
 * Shows header when mouse is at the top of the screen or when scrolled to top
 */
function useAutoHideHeader(enabled: boolean) {
	const [isVisible, setIsVisible] = useState(!enabled);
	const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!enabled) {
			setIsVisible(true);
			return;
		}

		const handleMouseMove = (e: MouseEvent) => {
			// Show header when mouse is within 80px of the top
			if (e.clientY < 80) {
				if (hideTimeoutRef.current) {
					clearTimeout(hideTimeoutRef.current);
					hideTimeoutRef.current = null;
				}
				setIsVisible(true);
			} else if (e.clientY > 120) {
				// Hide after leaving the header area with a delay
				if (!hideTimeoutRef.current) {
					hideTimeoutRef.current = setTimeout(() => {
						setIsVisible(false);
						hideTimeoutRef.current = null;
					}, 400);
				}
			}
		};

		const handleScroll = () => {
			// Show header when at the very top of the page
			if (window.scrollY === 0) {
				setIsVisible(true);
			}
		};

		// Initially hide if in auto-hide mode
		setIsVisible(false);

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("scroll", handleScroll);
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current);
			}
		};
	}, [enabled]);

	return isVisible;
}

export function Header({
	viewMode,
	onViewModeChange,
	isKioskMode = false,
	className,
}: HeaderProps) {
	const { isFullscreen, toggleFullscreen } = useFullscreen();

	// Auto-hide in TV/kiosk mode
	const shouldAutoHide = viewMode === "tv" || isKioskMode;
	const isVisible = useAutoHideHeader(shouldAutoHide);

	return (
		<>
			{/* Spacer to prevent content jump - only when header is in normal mode */}
			{!shouldAutoHide && <div style={{ height: HEADER_HEIGHT }} />}

			{/* Header - always rendered, uses transform for smooth animation */}
			<motion.header
				initial={false}
				animate={{
					y: shouldAutoHide && !isVisible ? -HEADER_HEIGHT : 0,
					opacity: shouldAutoHide && !isVisible ? 0 : 1,
				}}
				transition={{
					type: "spring",
					stiffness: 400,
					damping: 40,
					mass: 0.8,
				}}
				className={cn(
					"fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
					className,
				)}
			>
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						{/* Left: Logo + Title */}
						<div className="flex items-center gap-3">
							<motion.div
								className="p-2 rounded-lg bg-primary/10"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Github className="h-6 w-6 text-primary" />
							</motion.div>
							<div>
								<h1 className="text-xl font-bold">GitHub Actions Dashboard</h1>
								<p className="text-sm text-muted-foreground">
									Real-time CI/CD status monitor
								</p>
							</div>
						</div>

						{/* Right: Controls */}
						<div className="flex items-center gap-2">
							{/* View Mode Toggle */}
							<div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
								<motion.button
									onClick={() => onViewModeChange("grid")}
									className={cn(
										"p-2 rounded-md transition-colors",
										viewMode === "grid"
											? "bg-background shadow-sm"
											: "hover:bg-background/50",
									)}
									title="Grid View"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Monitor className="h-4 w-4" />
								</motion.button>
								<motion.button
									onClick={() => onViewModeChange("tv")}
									className={cn(
										"p-2 rounded-md transition-colors",
										viewMode === "tv"
											? "bg-background shadow-sm"
											: "hover:bg-background/50",
									)}
									title="TV Display Mode"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Tv className="h-4 w-4" />
								</motion.button>
							</div>

							{/* Fullscreen Toggle */}
							<motion.button
								onClick={toggleFullscreen}
								className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
								title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								{isFullscreen ? (
									<Minimize2 className="h-4 w-4" />
								) : (
									<Maximize2 className="h-4 w-4" />
								)}
							</motion.button>

							{/* Live indicator */}
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
								</span>
								<span className="text-xs font-medium text-emerald-400">
									Live
								</span>
							</div>
						</div>
					</div>
				</div>
			</motion.header>

			{/* Invisible hover trigger zone when header is hidden */}
			{shouldAutoHide && !isVisible && (
				<div
					className="fixed top-0 left-0 right-0 h-4 z-40 cursor-pointer"
					aria-hidden="true"
				/>
			)}
		</>
	);
}
