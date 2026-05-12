import api from "./apiService";
import { User } from "../types/user";

const API_URL = "/api";

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    // withCredentials so the browser stores the HTTP-only jwt cookie
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  const data = await response.json();

  // The access token is now an HTTP-only cookie set by the server.
  // Only the refresh token (needed to renew the access cookie) and the
  // user profile (needed for UI display) are kept in localStorage.
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("user", JSON.stringify(data.user));

  return response;
};

export const signup = async (
  name: string,
  email: string,
  password: string,
  phoneNumber: string
) => {
  const response = await api.post("/auth/register", {
    name,
    email,
    password,
    phoneNumber,
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>("/users/me");
  return response.data;
};
