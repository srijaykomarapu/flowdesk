
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/users";

const userClient = axios.create({
  baseURL: API_BASE_URL,
});

userClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("flowdesk-token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const userApi = {
  getAll: async () => {
    const response = await userClient.get("");
    return response.data;
  },

  updateRole: async (id, role) => {
    const response = await userClient.patch(`/${id}/role`, { role });
    return response.data;
  },
};

export default userApi;
