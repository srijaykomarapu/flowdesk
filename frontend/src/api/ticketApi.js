
import axios from "axios";

const API_BASE_URL = "https://flowdesk-xugd.onrender.com/api/tickets";

const ticketClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every ticket request
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
  // Get all tickets accessible to the logged-in user
  getAll: async () => {
    const response = await ticketClient.get("");
    return response.data;
  },

  // Get a ticket by ID
  getById: async (id) => {
    const response = await ticketClient.get(`/${id}`);
    return response.data;
  },

  // Create a new ticket
  create: async (ticket) => {
    const response = await ticketClient.post("", ticket);
    return response.data;
  },

  // Update ticket status
  updateStatus: async (id, status) => {
    const response = await ticketClient.patch(`/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Assign a ticket to an agent using their email
  assign: async (id, agentEmail) => {
    const response = await ticketClient.patch(
      `/${id}/assignment`,
      { agentEmail }
    );
    return response.data;
  },

  // Delete a ticket
  delete: async (id) => {
    await ticketClient.delete(`/${id}`);
  },
};

export default ticketApi;
