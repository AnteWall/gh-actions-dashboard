import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { createServerFn } from "@tanstack/react-start";
import { ConvexProvider } from "convex/react";
import { routeTree } from "./routeTree.gen";

// Server function to get runtime CONVEX_URL for browser clients
// Uses CONVEX_PUBLIC_URL if set (for external access), falls back to CONVEX_URL
export const getConvexUrl = createServerFn({ method: "GET" }).handler(() => {
	// For browser clients, prefer CONVEX_PUBLIC_URL (external URL)
	// Fall back to CONVEX_URL if not set
	const url = process.env.CONVEX_PUBLIC_URL || process.env.CONVEX_URL;
	if (!url) {
		throw new Error(
			"CONVEX_URL or CONVEX_PUBLIC_URL environment variable is required",
		);
	}
	return url;
});

// Create router with the Convex URL
export function createAppRouter(convexUrl: string) {
	const convexQueryClient = new ConvexQueryClient(convexUrl);

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
				gcTime: 5000,
			},
		},
	});
	convexQueryClient.connect(queryClient);

	const router = routerWithQueryClient(
		createRouter({
			routeTree,
			defaultPreload: "intent",
			context: { queryClient },
			scrollRestoration: true,
			defaultPreloadStaleTime: 0,
			defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
			defaultNotFoundComponent: () => <p>not found</p>,
			Wrap: ({ children }) => (
				<ConvexProvider client={convexQueryClient.convexClient}>
					{children}
				</ConvexProvider>
			),
		}),
		queryClient,
	);

	return router;
}

// Cached router instance
let routerInstance: ReturnType<typeof createAppRouter> | null = null;

// For SSR - get URL synchronously from process.env
export async function getRouter() {
	if (routerInstance) {
		return routerInstance;
	}

	// On server, use process.env directly; on client, call the server function
	const convexUrl =
		typeof window === "undefined"
			? process.env.CONVEX_URL!
			: await getConvexUrl();

	if (!convexUrl) {
		throw new Error("CONVEX_URL environment variable is required");
	}

	routerInstance = createAppRouter(convexUrl);
	return routerInstance;
}
