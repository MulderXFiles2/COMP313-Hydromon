/**
 * http.js
 *
 * Centralized HTTP client wrapper for the frontend.
 * Handles base API URL configuration and shared request behavior.
 */

import { getToken, clearAuthSession } from "./auth.api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 401) {
    clearAuthSession();
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}