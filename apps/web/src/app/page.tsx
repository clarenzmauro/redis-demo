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
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useQuery } from "convex/react";
import { api } from "@redis-demo/backend/convex/_generated/api";
import type { Id } from "@redis-demo/backend/convex/_generated/dataModel";

export default function Home() {
	const [newTodoText, setNewTodoText] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const todos = useQuery(api.todos.getAll);

	const handleAddTodo = async (e: React.FormEvent) => {
		e.preventDefault();
		const text = newTodoText.trim();
		if (!text) return;

		setIsLoading(true);

		try {
			const response = await fetch("/api/todos", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ text }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				toast.error(errorData.error || "Failed to add todo");
				return;
			}

			setNewTodoText("");
		} catch (err) {
			toast.error("Network error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handleToggleTodo = async (id: Id<"todos">, currentCompleted: boolean) => {
		try {
			const response = await fetch(`/api/todos/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ completed: !currentCompleted }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				toast.error(errorData.error || "Failed to toggle todo");
				return;
			}

		} catch (err) {
			toast.error("Network error occurred");
		}
	};

	const handleDeleteTodo = async (id: Id<"todos">) => {
		try {
			const response = await fetch(`/api/todos/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				toast.error(errorData.error || "Failed to delete todo");
				return;
			}

		} catch (err) {
			toast.error("Network error occurred");
		}
	};

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-8 text-center">
				<h1 className="mb-2 text-3xl font-bold">Redis Todo Demo</h1>
				<p className="text-muted-foreground">
					A simple todo app with Redis caching and rate limiting
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Todo List</CardTitle>
					<CardDescription>Manage your tasks efficiently</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleAddTodo}
						className="mb-6 flex items-center space-x-2"
					>
						<Input
							value={newTodoText}
							onChange={(e) => setNewTodoText(e.target.value)}
							placeholder="Add a new task..."
						/>
						<Button type="submit" disabled={!newTodoText.trim() || isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adding...
								</>
							) : (
								"Add"
							)}
						</Button>
					</form>

					{todos === undefined ? (
						<div className="flex justify-center py-4">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : todos.length === 0 ? (
						<p className="py-4 text-center">No todos yet. Add one above!</p>
					) : (
						<ul className="space-y-2">
							{todos.map((todo) => (
								<li
									key={todo._id}
									className="flex items-center justify-between rounded-md border p-2"
								>
									<div className="flex items-center space-x-2">
										<Checkbox
											checked={todo.completed}
											onCheckedChange={() =>
												handleToggleTodo(todo._id, todo.completed)
											}
											id={`todo-${todo._id}`}
										/>
										<label
											htmlFor={`todo-${todo._id}`}
											className={`${todo.completed ? "line-through text-muted-foreground" : ""}`}
										>
											{todo.text}
										</label>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleDeleteTodo(todo._id)}
										aria-label="Delete todo"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
