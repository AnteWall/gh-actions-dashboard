import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { createServerFn } from "@tanstack/react-start";
import { routeTree } from "./routeTree.gen";

// Server function to get runtime CONVEX_URL for browser clients
// Uses CONVEX_PUBLIC_URL if set (for external access), falls back to CONVEX_URL
export const getConvexUrl = createServerFn({ method: "GET" }).handler(() => {
	const url = process.env.CONVEX_PUBLIC_URL || process.env.CONVEX_URL;
	if (!url) {
		throw new Error(
			"CONVEX_URL or CONVEX_PUBLIC_URL environment variable is required",
		);
	}
	return url;
});

// Create a basic query client for the router
function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
			},
		},
	});
}

// Create router
export function getRouter() {
	const queryClient = createQueryClient();

	const router = routerWithQueryClient(
		createRouter({
			routeTree,
			defaultPreload: "intent",
			context: { queryClient },
			scrollRestoration: true,
			defaultPreloadStaleTime: 0,
			defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
			defaultNotFoundComponent: () => <p>not found</p>,
		}),
		queryClient,
	);

	return router;
}
