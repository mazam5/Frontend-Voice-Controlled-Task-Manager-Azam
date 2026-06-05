import bcrypt from "bcryptjs";

export const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface User {
  id: number;
  name: string;
  email: string;
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

};
