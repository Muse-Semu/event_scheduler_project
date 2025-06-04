// src/hooks/useAuth.ts
import apiClient from "../api/client";
import useAuthStore from "../store/authStore";

interface Credentials {
  username: string;
  password: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
}

export const useAuth = () => {
  const { setTokens, setAuthenticated, setUser } = useAuthStore();

  const fetchCurrentUser = async (): Promise<UserData> => {
    try {
      const response = await apiClient.get("/current-user/");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      throw error;
    }
  };

  const login = async (credentials: Credentials) => {
    try {
      // 1. Get tokens
      const tokenResponse = await apiClient.post("/token/", credentials);
      const { access, refresh } = tokenResponse.data;

      // Store tokens
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      setTokens(access, refresh);

      // 2. Get user data
      const userData = await fetchCurrentUser();
      setUser(userData);

      setAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setTokens(null, null);
    setAuthenticated(false);
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) throw new Error("No refresh token");

      const response = await apiClient.post("/token/refresh/", { refresh });
      const { access } = response.data;

      localStorage.setItem("access_token", access);
      setTokens(access, refresh);

      // Refresh user data as well
      const userData = await fetchCurrentUser();
      setUser(userData);

      return access;
    } catch (error) {
      logout();
      throw new Error("Session expired");
    }
  };

  return { login, logout, refreshToken, fetchCurrentUser };
};
