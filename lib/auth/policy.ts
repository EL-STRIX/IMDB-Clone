export type Action = "read" | "write" | "delete";
export type Resource = "awards" | "profile" | "watchlist";

export interface User {
  id?: string;
  role?: "admin" | "editor" | "viewer" | "guest";
}

/**
 * Policy check enforcing access rules:
 * - 'read' is public (anyone, including guests or unauthenticated users, can read).
 * - 'write' requires an editor or admin role.
 * - 'delete' strictly requires an admin role.
 */
export function can(
  user: User | null | undefined,
  action: Action,
  resource: Resource
): boolean {
  // Public read access for resources
  if (action === "read") {
    return true;
  }

  // Non-read operations require authenticated user with appropriate role
  if (!user || !user.role) {
    return false;
  }

  if (action === "write") {
    return user.role === "admin" || user.role === "editor";
  }

  if (action === "delete") {
    return user.role === "admin";
  }

  return false;
}
