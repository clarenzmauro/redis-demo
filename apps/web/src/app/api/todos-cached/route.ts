import { ConvexHttpClient } from "convex/browser";
import { api } from "@redis-demo/backend/convex/_generated/api";
import { redis } from "@/lib/redis";
import { fetchTodosLimiter } from "@/lib/rate-limiter";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper to get client IP
function getClientIP(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	const realIP = request.headers.get("x-real-ip");
	const clientIP = request.headers.get("x-client-ip");

	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	if (realIP) {
		return realIP;
	}
	if (clientIP) {
		return clientIP;
	}

	// Fallback for development
	return "127.0.0.1";
}

export async function GET(request: Request) {
	const clientIP = getClientIP(request);

	// Check rate limit
	const rateLimitResult = await fetchTodosLimiter.checkLimit(clientIP);
	if (!rateLimitResult.allowed) {
		return NextResponse.json(
			{
				error: "Rate limit exceeded",
				retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
			},
			{
				status: 429,
				headers: {
					"Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
					"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
				},
			}
		);
	}

	const startTime = Date.now();
	const cacheKey = "todos";

	try {
		// Try to get from Redis first
		const cached = await redis.get(cacheKey);
		if (cached) {
			const endTime = Date.now();
			return NextResponse.json({
				source: "redis",
				data: cached,
				timeMs: endTime - startTime,
			});
		}

		// Fetch from Convex if not in cache
		const data = await convex.query(api.todos.getAll);

		// Store in Redis with 60 second TTL
		await redis.setex(cacheKey, 60, data);

		const endTime = Date.now();
		return NextResponse.json({
			source: "convex",
			data,
			timeMs: endTime - startTime,
		});
	} catch (error) {
		console.error("Error fetching todos:", error);
		return NextResponse.json(
			{ error: "Failed to fetch todos" },
			{ status: 500 }
		);
	}
}
