import { ConvexHttpClient } from "convex/browser";
import { api } from "@redis-demo/backend/convex/_generated/api";
import { todoActionLimiter } from "@/lib/rate-limiter";
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

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const clientIP = getClientIP(request);

		// Check rate limit for todo actions
		const rateLimitResult = await todoActionLimiter.checkLimit(clientIP);
		if (!rateLimitResult.allowed) {
			return NextResponse.json(
				{
					error: "Rate limit exceeded. You can perform 5 todo actions per minute.",
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
		const { completed } = body;

		if (typeof completed !== "boolean") {
			return NextResponse.json(
				{ error: "Completed must be a boolean" },
				{ status: 400 }
			);
		}

		await convex.mutation(api.todos.toggle, {
			id: id as any,
			completed,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error toggling todo:", error);
		return NextResponse.json(
			{ error: "Failed to toggle todo" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const clientIP = getClientIP(request);

		// Check rate limit for todo actions
		const rateLimitResult = await todoActionLimiter.checkLimit(clientIP);
		if (!rateLimitResult.allowed) {
			return NextResponse.json(
				{
					error: "Rate limit exceeded. You can perform 5 todo actions per minute.",
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

		await convex.mutation(api.todos.deleteTodo, {
			id: id as any,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting todo:", error);
		return NextResponse.json(
			{ error: "Failed to delete todo" },
			{ status: 500 }
		);
	}
}
