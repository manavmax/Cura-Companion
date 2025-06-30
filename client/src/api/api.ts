import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('=== API REQUEST DEBUG ===');
    console.log('Request URL:', config.url);
    console.log('Request Method:', config.method);
    
    const token = localStorage.getItem("accessToken");
    console.log('Access Token:', token ? 'Present' : 'Missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('No access token found in localStorage');
    }
    
    console.log('Final headers:', config.headers);
    return config;
  },
  (error) => {
    console.log('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('=== API RESPONSE SUCCESS ===');
    console.log('Response status:', response.status);
    console.log('Response URL:', response.config.url);
    return response;
  },
  async (error) => {
    console.log('=== API RESPONSE ERROR ===');
    console.log('Error status:', error.response?.status);
    console.log('Error URL:', error.config?.url);
    console.log('Error message:', error.message);
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Attempting token refresh...');
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        console.log('Refresh token:', refreshToken ? 'Present' : 'Missing');
        
        if (refreshToken) {
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem("accessToken", accessToken);
          console.log('Token refreshed successfully');

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        const errorMsg = refreshError instanceof Error ? refreshError.message : String(refreshError);
        console.log('Token refresh failed:', errorMsg);
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
