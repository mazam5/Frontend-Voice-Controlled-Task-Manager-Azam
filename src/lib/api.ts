import bcrypt from "bcryptjs";

export const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getWsUrl = () => {
  const envUrl = import.meta.env.VITE_WS_URL;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  if (envUrl) {
    if (isHttps && envUrl.startsWith("ws://")) {
      return envUrl.replace("ws://", "wss://");
    }
    return envUrl;
  }

  // Auto-generate based on BACKEND_URL
  const base = BACKEND_URL.replace(/^http/, "ws");
  return base.endsWith("/ws") ? base : `${base}/ws`;
};

export const BACKEND_WS_URL = getWsUrl();

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  scheduled_at: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VoiceChatResponse {
  textResponse: string;
  tasks: Task[];
  log?: string;
}

// Get auth token from local storage
export const getToken = (): string | null => {
  return localStorage.getItem("auralist_token");
};

// Set token
export const setToken = (token: string) => {
  localStorage.setItem("auralist_token", token);
};

// Get user info
export const getUserInfo = (): User | null => {
  const userJson = localStorage.getItem("auralist_user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

// Set user info
export const setUserInfo = (user: User) => {
  localStorage.setItem("auralist_user", JSON.stringify(user));
};

// Clear auth
export const logoutUser = () => {
  localStorage.removeItem("auralist_token");
  localStorage.removeItem("auralist_user");
};

// Fetch wrapper with auth header
const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Content-Type", "application/json");

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Session expired or unauthorized, logout
    logoutUser();
    window.location.reload();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
};

export const api = {
  // Auth
  convertPassword: (password: string): string => {
    const staticSalt = "$2b$10$abcdefghijklmnopqrstuu";
    return bcrypt.hashSync(password, staticSalt);
  },

  login: async (credentials: any) => {
    const payload = {
      ...credentials,
      password: api.convertPassword(credentials.password)
    };
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Login failed");
    }

    const data = await response.json();
    setToken(data.token);
    setUserInfo(data.user);
    return data;
  },

  register: async (details: any) => {
    const payload = {
      ...details,
      password: api.convertPassword(details.password)
    };
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Registration failed");
    }

    return response.json();
  },


  getTasks: (): Promise<Task[]> => authFetch("/api/tasks"),

  resetSession: () =>
    authFetch("/api/voice/reset", { method: "POST" }),
};
