// src/store/authStore.ts
import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string | null, refresh: string | null) => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("access_token"),
  refreshToken: localStorage.getItem("refresh_token"),
  isAuthenticated: !!localStorage.getItem("access_token"),
  setTokens: (access, refresh) =>
    set({
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: !!access,
    }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
