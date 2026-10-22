
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/tickets";

const ticketClient = axios.create({
  baseURL: API_BASE_URL,
});

ticketClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("flowdesk-token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const ticketApi = {
  getAll: async () => {
    const response = await ticketClient.get("");
    return response.data;
  },

  getById: async (id) => {
    const response = await ticketClient.get(`/${id}`);
    return response.data;
  },

  create: async (ticket) => {
    const response = await ticketClient.post("", ticket);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await ticketClient.patch(`/${id}/status`, {
      status,
    });
    return response.data;
  },

  delete: async (id) => {
    await ticketClient.delete(`/${id}`);
  },
};

export default ticketApi;
