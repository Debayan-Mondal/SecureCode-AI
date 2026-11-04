import { create } from "zustand";

const useBackendStatusStore = create((set) => ({
  isWakingUp: false,

  showWakingUp: () => set({ isWakingUp: true }),

  hideWakingUp: () => set({ isWakingUp: false }),
}));

export default useBackendStatusStore;