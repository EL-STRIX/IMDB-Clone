export type UserRole = "user" | "critic" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

export type AuthProviderType = "demo" | "github" | "google";

export interface SignInOptions {
  provider: AuthProviderType;
  username?: string;
  email?: string;
}
