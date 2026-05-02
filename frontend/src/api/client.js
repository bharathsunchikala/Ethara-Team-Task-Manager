import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? "/api" : "http://localhost:5000/api")
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ethara_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Something went wrong";

    if (status === 401) {
      localStorage.removeItem("ethara_token");
      window.dispatchEvent(new Event("ethara:logout"));
    }

    if (status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
