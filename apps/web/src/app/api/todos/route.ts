import { ConvexHttpClient } from "convex/browser";
import { api } from "@redis-demo/backend/convex/_generated/api";
import { addTodoLimiter } from "@/lib/rate-limiter";
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

export async function POST(request: Request) {
	try {
		const clientIP = getClientIP(request);

		// Check rate limit for adding todos
		const rateLimitResult = await addTodoLimiter.checkLimit(clientIP);
		if (!rateLimitResult.allowed) {
			return NextResponse.json(
				{
					error: "Rate limit exceeded. You can add 5 todos per minute.",
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

		const body = await request.json();
		const { text } = body;

		if (!text || typeof text !== "string" || text.trim().length === 0) {
			return NextResponse.json(
				{ error: "Text is required and must be a non-empty string" },
				{ status: 400 }
			);
		}

		const todo = await convex.mutation(api.todos.create, {
			text: text.trim(),
		});

		return NextResponse.json({ success: true, todo });
	} catch (error) {
		console.error("Error creating todo:", error);
		return NextResponse.json(
			{ error: "Failed to create todo" },
			{ status: 500 }
		);
	}
}
