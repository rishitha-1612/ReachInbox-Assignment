import { api } from "@/lib/api";

export interface CurrentUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get("/auth/me");
  return response.data.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export function getGoogleLoginUrl(): string {
  return `${
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:5000/api/v1"
  }/auth/google`;
}