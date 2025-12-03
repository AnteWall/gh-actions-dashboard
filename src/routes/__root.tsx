import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { ConvexProvider } from "convex/react";
import type * as React from "react";
import { useMemo } from "react";
import { getConvexUrl } from "@/router";
import appCss from "@/styles/app.css?url";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	loader: async () => {
		const convexUrl = await getConvexUrl();
		return { convexUrl };
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "GitHub Actions Dashboard",
			},
			{
				name: "description",
				content: "Real-time CI/CD status monitor for GitHub Actions",
			},
			{
				name: "theme-color",
				content: "#0a0a0a",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
			{ rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
			{ rel: "icon", href: "/favicon.ico" },
		],
	}),
	notFoundComponent: () => (
		<div className="flex items-center justify-center min-h-screen bg-background text-foreground">
			<div className="text-center">
				<h1 className="text-4xl font-bold mb-4">404</h1>
				<p className="text-muted-foreground">Page not found</p>
			</div>
		</div>
	),
	component: RootComponent,
});

function RootComponent() {
	const { convexUrl } = Route.useLoaderData();

	// Create Convex client and QueryClient - memoized to prevent recreation
	const { convexQueryClient, queryClient } = useMemo(() => {
		const convexQueryClient = new ConvexQueryClient(convexUrl);
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					queryKeyHashFn: convexQueryClient.hashFn(),
					queryFn: convexQueryClient.queryFn(),
				},
			},
		});
		convexQueryClient.connect(queryClient);
		return { convexQueryClient, queryClient };
	}, [convexUrl]);

	return (
		<QueryClientProvider client={queryClient}>
			<ConvexProvider client={convexQueryClient.convexClient}>
				<RootDocument>
					<Outlet />
				</RootDocument>
			</ConvexProvider>
		</QueryClientProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background text-foreground antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	);
}
