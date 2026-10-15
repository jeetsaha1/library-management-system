import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("libtrack_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token is invalid or expired, prompt re-login by clearing session
    if (error.response && error.response.status === 401) {
      const isAuthCheck = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/register");
      if (!isAuthCheck) {
        sessionStorage.removeItem("libtrack_token");
        sessionStorage.removeItem("libtrack_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;