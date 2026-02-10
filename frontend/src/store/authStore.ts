import { create } from "zustand";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  userId: string;
  email?: string;
};

type AuthState = {
  token: string | null;
  userId: string | null;
  isInitialized: boolean;

  setToken: (token: string) => void;
  logout: () => void;
  initializeAuth: () => void;
};

const getTokenFromCookie = () => Cookies.get("token") || null;

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  isInitialized: false,

  setToken: (token) => {
    const decoded = jwtDecode<JwtPayload>(token);
    Cookies.set("token", token, { sameSite: "strict" });

    set({
      token,
      userId: decoded.userId,
      isInitialized: true,
    });
  },

  logout: () => {
    Cookies.remove("token");
    set({ token: null, userId: null, isInitialized: true });
  },

  initializeAuth: () => {
    const token = getTokenFromCookie();
    if (!token) {
      set({ isInitialized: true });
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      set({
        token,
        userId: decoded?.userId,
        isInitialized: true,
      });
    } catch {
      Cookies.remove("token");
      set({ token: null, userId: null, isInitialized: true });
    }
  },
}));
