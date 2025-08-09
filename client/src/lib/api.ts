const API = import.meta.env.VITE_API_BASE || '';
export const getPosts = async () => {
  const r = await fetch(`${API}/api/posts`, { credentials: 'include' });
  if (!r.ok) throw new Error('Failed to fetch posts');
  return r.json();
};
