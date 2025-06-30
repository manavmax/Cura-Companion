import api from './api';

console.log('=== AUTH.TS MODULE LOADING ===');

// Description: User login
// Endpoint: POST /api/auth/login
// Request: { email: string, password: string }
// Response: { success: boolean, message: string, accessToken: string, refreshToken?: string, user: { _id: string, email: string } }
export const login = async (credentials: { email: string; password: string }) => {
  console.log('=== LOGIN FUNCTION CALLED ===');
  console.log('Credentials:', credentials);
  try {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: User registration
// Endpoint: POST /api/auth/register
// Request: { email: string, password: string }
// Response: { success: boolean, message: string, accessToken: string, user: { _id: string, email: string } }
export const registerUser = async (userData: { email: string; password: string }) => {
  console.log('=== REGISTER USER FUNCTION CALLED ===');
  console.log('User data:', userData);
  try {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: User logout
// Endpoint: POST /api/auth/logout
// Request: {}
// Response: { success: boolean, message: string }
export const logout = async () => {
  console.log('=== LOGOUT FUNCTION CALLED ===');
  try {
    const response = await api.post('/api/auth/logout');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Refresh access token
// Endpoint: POST /api/auth/refresh
// Request: { refreshToken: string }
// Response: { accessToken: string }
export const refreshToken = async (refreshToken: string) => {
  console.log('=== REFRESH TOKEN FUNCTION CALLED ===');
  try {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

console.log('=== AUTH.TS EXPORTS ===');
console.log('login function:', typeof login);
console.log('registerUser function:', typeof registerUser);
console.log('logout function:', typeof logout);
console.log('refreshToken function:', typeof refreshToken);