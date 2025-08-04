import React, { useEffect, useState } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/posts`)
      .then(res => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then(data => {
        const enriched = data.map(p => ({
          ...p,
          upvoted: false,
          bookmarked: false,
          votes: p.votes || 0
        }));
        setPosts(enriched);
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const toggleUpvote = idx => {
    setPosts(prev =>
      prev.map((p, i) => {
        if (i !== idx) return p;
        const upvoted = !p.upvoted;
        return { ...p, upvoted, votes: p.votes + (upvoted ? 1 : -1) };
      })
    );
  };

  const toggleBookmark = idx => {
    setPosts(prev => prev.map((p, i) => (i === idx ? { ...p, bookmarked: !p.bookmarked } : p)));
  };

  return (
    <>
      <header>
        <div className="logo">
          <i className="fas fa-comments"></i>
          <span>PATWUA</span>
        </div>

        <div className="header-actions">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search..." />
          </div>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="user-avatar">JD</div>
        </div>
      </header>

      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Search..." />
        </div>
        <div className="mobile-nav">
          <a href="#" className="btn">Home</a>
          <a href="#" className="btn">Trending</a>
          <a href="#" className="btn">Notifications</a>
        </div>
      </div>

      <section className="hero">
        <h1>Where Every Voice Has a Place</h1>
        <p>Share your thoughts, stories, and ideas with the Patwua community.</p>
        <a href="#" className="cta-button">Start Writing</a>
      </section>

      <div className="container">
        <div className="left-column">
          {error && (
            <div className="post-card">
              <p>Error: {error}</p>
            </div>
          )}

          {!error && posts.length === 0 && (
            <div className="post-card">
              <p>Loading posts...</p>
            </div>
          )}

          {posts.map((post, idx) => (
            <div className="post-card" key={post._id || idx}>
              <h2>{post.title}</h2>
              <div className="post-meta">
                <div className="author">
                  <div className="author-avatar">{(post.author || 'U').slice(0, 2).toUpperCase()}</div>
                  <span>{post.author || 'Anonymous'}</span>
                </div>
                {post.createdAt && <span>{new Date(post.createdAt).toLocaleString()}</span>}
                <span>·</span>
                <span><i className="fas fa-eye"></i> {post.views || 0} views</span>
              </div>
              <p>{post.excerpt || post.fullContent}</p>
              <div className="post-actions">
                <div
                  className={`action-btn upvote-btn ${post.upvoted ? 'active' : ''}`}
                  onClick={() => toggleUpvote(idx)}
                >
                  <i className="fas fa-arrow-up"></i>
                  <span className="upvote-count">{post.votes}</span>
                </div>
                <div className="action-btn comment-btn">
                  <i className="fas fa-comment"></i>
                  <span>{post.comments || 0} comments</span>
                </div>
                <div
                  className={`action-btn bookmark-btn ${post.bookmarked ? 'active' : ''}`}
                  onClick={() => toggleBookmark(idx)}
                >
                  <i className={`${post.bookmarked ? 'fas' : 'far'} fa-bookmark`}></i>
                  <span>{post.bookmarked ? 'Saved' : 'Save'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="right-column">
          <div className="sidebar-section">
            <h3><i className="fas fa-fire"></i> Trending Tags</h3>
            <div className="tags-container">
              <div className="tag">#Guyana</div>
              <div className="tag">#Community</div>
              <div className="tag">#Politics</div>
              <div className="tag">#Technology</div>
              <div className="tag">#Biodiversity</div>
              <div className="tag">#Science</div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3><i className="fas fa-comment-dots"></i> Latest Comments</h3>
            <div className="comment">
              <div className="comment-avatar">AS</div>
              <div className="comment-content">
                <div className="comment-author">Asha Singh</div>
                <p className="comment-text">Impressive showcase of innovation! The AI deforestation detection could be game-changing for rainforest conservation.</p>
                <div className="comment-actions">
                  <span className="comment-action">Reply</span>
                  <span className="comment-action"><i className="fas fa-thumbs-up"></i> 3</span>
                </div>
              </div>
            </div>
            <div className="comment">
              <div className="comment-avatar">MC</div>
              <div className="comment-content">
                <div className="comment-author">Maria Chen</div>
                <p className="comment-text">We need more dialogue like this between global south nations. The technology transfer potential is exciting!</p>
                <div className="comment-actions">
                  <span className="comment-action">Reply</span>
                  <span className="comment-action"><i className="fas fa-thumbs-up"></i> 1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-section profile-card">
            <div className="profile-avatar">JD</div>
            <h3>Jane Doe</h3>
            <p>Community Member</p>
            <div className="profile-stats">
              <div className="stat">
                <div className="stat-value">5</div>
                <div>Posts</div>
              </div>
              <div className="stat">
                <div className="stat-value">720</div>
                <div>Upvotes</div>
              </div>
              <div className="stat">
                <div className="stat-value">12</div>
                <div>Replies</div>
              </div>
            </div>
            <div className="tags-container">
              <div className="tag">#GuyanaCommunity</div>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Guidelines</a>
        </div>
        <button className="cta-button" style={{ backgroundColor: 'var(--primary)', color: 'white', marginTop: '1rem' }}>
          <i className="fas fa-plus"></i> Start a Post
        </button>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
          © 2023 Patwua. All voices welcome.
        </p>
      </footer>
    </>
  );
}

export default App;
