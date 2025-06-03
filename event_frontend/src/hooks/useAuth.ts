import apiClient from "../api/client";
import useAuthStore from "../store/authStore";

interface Credentials {
  username: string;
  password: string;
}

export const useAuth = () => {
  const { setTokens, setAuthenticated } = useAuthStore();

  const login = async (credentials: Credentials) => {
    try {
      const response = await apiClient.post("/token/", credentials);
      const { access, refresh } = response.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      setTokens(access, refresh);
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
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) throw new Error("No refresh token");
      const response = await apiClient.post("/token/refresh/", { refresh });
      const { access } = response.data;
      localStorage.setItem("access_token", access);
      setTokens(access, refresh);
      return access;
    } catch (error) {
      logout();
      throw new Error("Session expired");
    }
  };

  return { login, logout, refreshToken };
};
