import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const register = async (username: string, email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/register`, { username, email, password });
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });
  return response.data;
};

export const getCurrentUser = async (token: string) => {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
