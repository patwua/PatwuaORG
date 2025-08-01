import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getPosts = async (category: string) => {
  const response = await axios.get(`${API_URL}/posts`, {
    params: { category }
  });
  return response.data;
};

export const votePost = async (postId: string, voteType: 'up' | 'down') => {
  const response = await axios.patch(`${API_URL}/posts/${postId}/vote`, { voteType });
  return response.data;
};
