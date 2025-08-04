import React, { useEffect, useState } from 'react';
import './App.css';

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

  return (
    <>
      <header>
        <div className="logo">PATWUA</div>
        <div className="search-bar">
          <input type="text" placeholder="Search posts, tags, or users..." />
        </div>
        <div className="user-profile-icon">👤</div>
      </header>

      <section className="hero-banner">
        <h1>Where Every Voice Has a Place</h1>
        <p>Share your thoughts, stories, and ideas with the Patwua.</p>
      </section>

      <div className="container">
        <div className="left-column">
          {error && (
            <div className="post-card">
              <p>Error: {error}</p>
            </div>
          )}

          {!error && !posts && (
            <div className="post-card">
              <p>Loading posts...</p>
            </div>
          )}

          {posts && posts.map(post => (
            <div className="post-card" key={post._id}>
              <h2>{post.title}</h2>
              <div className="meta">
                Posted by {post.author || 'Anonymous'} {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
              </div>
              <p>{post.excerpt || post.content}</p>
            </div>
          ))}
        </div>

        <div className="right-column">
          <div className="sidebar-section">
            <h3>Trending Tags</h3>
            <div className="tags-container">
              <span className="tag">#Guyana</span>
              <span className="tag">#community</span>
              <span className="tag">#politics</span>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Latest Comments</h3>
            <div className="comment">
              <div className="comment-author">Asha Singh</div>
              <p>Impressive showcase of innovation!</p>
            </div>
            <div className="comment">
              <div className="comment-author">Maria Chen</div>
              <p>We need more dialogue like this.</p>
            </div>
          </div>

          <div className="sidebar-section">
            <button className="btn">Join the Conversation</button>
          </div>

          <div className="sidebar-section user-profile-card">
            <div className="user-avatar">👩</div>
            <h3>Jane Doe</h3>
            <div className="user-stats">
              <div className="stat">
                <div className="stat-value">5</div>
                <div>Posts</div>
              </div>
              <div className="stat">
                <div className="stat-value">720</div>
                <div>Upvotes</div>
              </div>
              <div className="stat">
                <div className="stat-value">0</div>
                <div>Emphasis</div>
              </div>
            </div>
            <div className="tags-container">
              <span className="tag">#Guyana community</span>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Terms</a>
        </div>
        <button className="btn">Start a Post</button>
      </footer>
    </>
  );
}

export default App;
