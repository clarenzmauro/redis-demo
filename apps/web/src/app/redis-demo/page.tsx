"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, Database, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Todo {
	_id: string;
	text: string;
	completed: boolean;
}

interface ApiResponse {
	source: "redis" | "convex";
	data: Todo[];
	timeMs: number;
}

export default function RedisDemoPage() {
	const [response, setResponse] = useState<ApiResponse | null>(null);
	const [loading, setLoading] = useState(false);

	const fetchTodos = async () => {
		setLoading(true);

		try {
			const res = await fetch("/api/todos-cached");
			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Failed to fetch");
				return;
			}

			setResponse(data);
		} catch (err) {
			toast.error("Network error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-8 text-center">
				<h1 className="mb-2 text-3xl font-bold">Redis Cache Demo</h1>
				<p className="text-muted-foreground">
					See how Redis caching speeds up your Convex queries
				</p>
			</div>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="h-5 w-5" />
						Cache Test
					</CardTitle>
					<CardDescription>
						Click the button to fetch todos. First request hits Convex, subsequent requests hit Redis cache.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={fetchTodos}
						disabled={loading}
						className="w-full"
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Fetching...
							</>
						) : (
							<>
								<RefreshCw className="mr-2 h-4 w-4" />
								Fetch Todos
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			{response && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Zap className="h-5 w-5" />
							Results from {response.source === "redis" ? "Redis Cache" : "Convex Database"}
						</CardTitle>
						<CardDescription>
							Response time: {response.timeMs}ms
							{response.source === "redis" && " (cached)"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{response.data.length === 0 ? (
							<p className="text-center text-muted-foreground py-4">
								No todos found. Add some in the Todos page first!
							</p>
						) : (
							<ul className="space-y-2">
								{response.data.map((todo) => (
									<li
										key={todo._id}
										className="flex items-center space-x-3 rounded-lg border p-3"
									>
										<Checkbox checked={todo.completed} disabled />
										<span
											className={
												todo.completed
													? "line-through text-muted-foreground"
													: ""
											}
										>
											{todo.text}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>How it works</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3 text-sm text-muted-foreground">
						<p>
							<strong>First request:</strong> Data fetched from Convex → stored in Redis cache for 60 seconds
						</p>
						<p>
							<strong>Subsequent requests:</strong> Data served directly from Redis cache (much faster!)
						</p>
						<p>
							<strong>After 60 seconds:</strong> Cache expires, next request will hit Convex again
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
