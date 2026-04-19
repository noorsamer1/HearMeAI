import { apiFetch, setStoredToken } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  user_type: string;
  locale: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function registerAccount(body: {
  email: string;
  password: string;
  display_name: string;
  user_type: "deaf" | "mute" | "both";
  locale?: string;
}): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setStoredToken(res.access_token);
  return res;
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setStoredToken(res.access_token);
  return res;
}

export async function logoutAccount(token: string | null): Promise<void> {
  await apiFetch("/api/v1/auth/logout", { method: "POST", token });
  setStoredToken(null);
}

export async function fetchMe(token: string): Promise<{
  id: string;
  email: string;
  display_name: string;
  user_type: string;
  locale: string;
  font_scale: string;
  high_contrast: boolean;
}> {
  return apiFetch("/api/v1/users/me", { token });
}
