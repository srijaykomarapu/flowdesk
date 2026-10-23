
import axios from "axios";

const AUTH_URL = "https://flowdesk-xugd.onrender.com/api/auth";

const authApi = {
  register: async (userData) => {
    const response = await axios.post(
      `${AUTH_URL}/register`,
      userData
    );
    return response.data;
  },

  login: async (credentials) => {
    const response = await axios.post(
      `${AUTH_URL}/login`,
      credentials
    );
    return response.data;
  },
};

export default authApi;
