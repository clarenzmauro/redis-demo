import { ConvexHttpClient } from "convex/browser";
import { api } from "@redis-demo/backend/convex/_generated/api";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
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
