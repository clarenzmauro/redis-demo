import { redis } from "./redis";

interface RateLimitOptions {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests allowed in the window
	keyPrefix?: string; // Optional key prefix to separate different rate limiters
}

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetTime: number;
}

export class RateLimiter {
	private windowMs: number;
	private maxRequests: number;
	private keyPrefix: string;

	constructor(options: RateLimitOptions) {
		this.windowMs = options.windowMs;
		this.maxRequests = options.maxRequests;
		this.keyPrefix = options.keyPrefix || "ratelimit";
	}

	async checkLimit(identifier: string): Promise<RateLimitResult> {
		const now = Date.now();
		const windowStart = now - this.windowMs;

		// Redis key for this identifier (IP address or user ID)
		const key = `${this.keyPrefix}:${identifier}`;

		// First: Clean up old entries and count current requests (without adding new one)
		const checkMulti = redis.multi();
		checkMulti.zremrangebyscore(key, 0, windowStart); // Remove old entries
		checkMulti.zcard(key); // Count remaining requests

		const checkResults = await checkMulti.exec();
		if (!checkResults) {
			throw new Error("Redis transaction failed");
		}

		const requestCount = checkResults[1] as number;
		const allowed = requestCount < this.maxRequests;

		// If allowed, add the current request
		if (allowed) {
			const addMulti = redis.multi();
			addMulti.zadd(key, { score: now, member: now.toString() }); // Add current request
			addMulti.pexpire(key, this.windowMs); // Set expiration

			const addResults = await addMulti.exec();
			if (!addResults) {
				throw new Error("Redis transaction failed");
			}
		}

		const remaining = Math.max(0, this.maxRequests - requestCount);

		return {
			allowed,
			remaining: allowed ? remaining - 1 : remaining,
			resetTime: now + this.windowMs,
		};
	}
}

// Pre-configured rate limiters with unique key prefixes
export const fetchTodosLimiter = new RateLimiter({
	windowMs: 60 * 1000, // 1 minute
	maxRequests: 5, // 5 requests per minute
	keyPrefix: "ratelimit:fetch-todos",
});

export const addTodoLimiter = new RateLimiter({
	windowMs: 60 * 1000, // 1 minute
	maxRequests: 5, // 5 adds per minute
	keyPrefix: "ratelimit:add-todo",
});

export const todoActionLimiter = new RateLimiter({
	windowMs: 60 * 1000, // 1 minute
	maxRequests: 5, // 5 actions (toggle/delete) per minute
	keyPrefix: "ratelimit:todo-action",
});
