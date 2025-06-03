import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Add request interceptor to include the token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
