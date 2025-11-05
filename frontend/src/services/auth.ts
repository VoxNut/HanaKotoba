import api from "./api";

export interface User {
  id: number;
  username: string;
  email: string;
  japanese_level: string;
  daily_goal: number;
  current_streak: number;
  total_studied_days: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  email: string;
  password_confirm: string;
  japanese_level?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post("/auth/login/", credentials);
    const { access, refresh, user } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    return user;
  },

  register: async (data: RegisterData) => {
    const response = await api.post("/auth/register/", data);
    const { tokens, user } = response.data;
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    return user;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/auth/users/me/");
    return response.data;
  },
};
