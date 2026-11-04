
import axios from "axios";
import useBackendStatusStore from "../stores/backendStatusStore.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const SLOW_REQUEST_THRESHOLD = 3000;

let activeSlowRequests = 0;

const cleanupRequest = (config) => {
  if (!config?.metadata) return;

  clearTimeout(config.metadata.slowTimer);

  if (config.metadata.isSlow) {
    activeSlowRequests = Math.max(0, activeSlowRequests - 1);
    config.metadata.isSlow = false;

    if (activeSlowRequests === 0) {
      useBackendStatusStore.getState().hideWakingUp();
    }
  }
};

// Start tracking when a request begins
api.interceptors.request.use((config) => {
  config.metadata = {
    startTime: Date.now(),
    isSlow: false,
  };

  config.metadata.slowTimer = setTimeout(() => {
    config.metadata.isSlow = true;
    activeSlowRequests += 1;

    useBackendStatusStore.getState().showWakingUp();
  }, SLOW_REQUEST_THRESHOLD);

  return config;
});

// Hide the indicator when a request succeeds
api.interceptors.response.use(
  (response) => {
    cleanupRequest(response.config);
    return response;
  },
  (error) => {
    cleanupRequest(error.config);
    return Promise.reject(error);
  }
);

export default api;
