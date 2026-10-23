
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/users";

const agentClient = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the JWT token
agentClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("flowdesk-token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const agentApi = {
  // Fetch all existing users whose role is AGENT
  getAgents: async () => {
    const response = await agentClient.get("/agents");
    return response.data;
  },
};

export default agentApi;
