import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/posts`)
      .then(res => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then(data => setPosts(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div>
        <h1>Patwua</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!posts) {
    return (
      <div>
        <h1>Patwua App Loading...</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Patwua Posts</h1>
      <ul>
        {posts.map(post => (
          <li key={post._id}>
            <strong>{post.title}</strong>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
