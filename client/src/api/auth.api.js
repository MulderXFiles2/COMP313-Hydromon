/**
 * auth.api.js
 *
 * API helpers for authentication requests and local auth session handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "hydro_auth_token";
const USER_KEY = "hydro_current_user";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const raw = window.localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = getToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export function storeAuthSession(token, user) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function registerUser(userData) {
  const result = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });

  storeAuthSession(result.token, result.user);
  return result;
}

export async function loginUser(credentials) {
  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  storeAuthSession(result.token, result.user);
  return result;
}

export async function fetchCurrentUser() {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function signout() {
  try {
    await request("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAuthSession();
  }
}