
import { create } from "zustand";
import api from "../lib/axios";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  authChecked: false,

  initializeAuth: async () => {
    try {
      const response = await api.get("/auth/me");

      set({
        user: response.data.user,
        isAuthenticated: true,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({
        isLoading: false,
        authChecked: true,
      });
    }
  },

  register: async (formData) => {
    const response = await api.post("/auth/register", formData);

    set({
      user: response.data.user,
      isAuthenticated: true,
    });

    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);

    set({
      user: response.data.user,
      isAuthenticated: true,
    });

    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.patch("/auth/profile", profileData);

    set({
      user: response.data.user,
    });

    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },
}));

export default useAuthStore;
