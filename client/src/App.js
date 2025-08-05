import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function PostCard({ post }) {
  const [upvoted, setUpvoted] = useState(false);
  const [bookmark, setBookmark] = useState(false);
  const [count, setCount] = useState(post.upvotes || 0);

  return (
    <div className="post-card">
      <h2>{post.title}</h2>
      <div className="post-meta">
        <div className="author">
          <div className="author-avatar">
            {(post.author || 'A')[0].toUpperCase()}
          </div>
          <span>{post.author || 'Anonymous'}</span>
        </div>
        {post.createdAt && (
          <span>{new Date(post.createdAt).toLocaleString()}</span>
        )}
      </div>
      <div className="post-content">
        <p>{post.excerpt || post.content}</p>
      </div>
      {post.tags && (
        <div className="post-tags">
          {post.tags.map(tag => (
            <span className="post-tag" key={tag}>#{tag}</span>
          ))}
        </div>
      )}
      <div className="post-actions">
        <div
          className={`action-btn upvote-btn ${upvoted ? 'active' : ''}`}
          onClick={() => {
            setUpvoted(!upvoted);
            setCount(count + (upvoted ? -1 : 1));
          }}
        >
          <i className="fas fa-arrow-up"></i>
          <span className="upvote-count">{count}</span>
        </div>
        <div className="action-btn comment-btn">
          <i className="fas fa-comment"></i>
          <span>{post.comments?.length || 0} comments</span>
        </div>
        <div
          className={`action-btn bookmark-btn ${bookmark ? 'active' : ''}`}
          onClick={() => setBookmark(!bookmark)}
        >
          <i className={bookmark ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
          <span>{bookmark ? 'Saved' : 'Save'}</span>
        </div>
        <div className="action-btn share-btn">
          <i className="fas fa-share"></i>
          <span>Share</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'enabled'
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/posts`)
      .then(res => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then(data => setPosts(data))
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode ? 'enabled' : 'disabled');
  }, [darkMode]);

  useEffect(() => {
    function handleClick(e) {
      if (menuOpen && !e.target.closest('.mobile-menu') && !e.target.closest('.mobile-menu-btn')) {
        setMenuOpen(false);
      }
      if (searchExpanded && searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchExpanded(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen, searchExpanded]);

  return (
    <>
      <header>
        <div className="header-left">
          <div className="logo">
            <i className="fas fa-comments"></i>
            <span>PATWUA</span>
          </div>
          <div
            className={`search-container ${searchExpanded ? 'expanded' : ''}`}
            ref={searchRef}
          >
            <i
              className="fas fa-search search-icon"
              onClick={e => {
                e.stopPropagation();
                setSearchExpanded(!searchExpanded);
              }}
            ></i>
            <input type="text" className="search-bar" placeholder="Search..." />
          </div>
          <div className="auth-buttons">
            <button className="auth-btn login-btn">Log In</button>
            <button className="auth-btn signup-btn">Sign Up</button>
          </div>
        </div>

        <div className="header-right">
          <button
            className="mobile-menu-btn"
            onClick={e => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <i className="fas fa-bars"></i>
          </button>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'active' : ''}`}>
        <div className="search-container expanded">
          <i className="fas fa-search search-icon"></i>
          <input type="text" className="search-bar" placeholder="Search..." />
        </div>
        <div className="mobile-nav">
          <a href="#">Home</a>
          <a href="#">Trending</a>
          <a href="#">Notifications</a>
          <a href="#">Log In</a>
          <a href="#">Sign Up</a>
        </div>
      </div>

      <section className="hero">
        <div className="hero-content">
          <h1>Where Every Voice Has a Place</h1>
          <p>Share your thoughts, stories, and ideas with the Patwua community.</p>
        </div>
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
            <PostCard key={post._id} post={post} />
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
              <div className="tag">#Culture</div>
              <div className="tag">#Innovation</div>
              <div className="tag">#Sustainability</div>
              <div className="tag">#Art</div>
              <div className="tag">#Food</div>
              <div className="tag">#Education</div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3><i className="fas fa-comment-dots"></i> Latest Comments</h3>
            <div className="comment">
              <div className="comment-avatar">AS</div>
              <div className="comment-content">
                <div className="comment-author">Asha Singh</div>
                <p className="comment-text">
                  Impressive showcase of innovation! The AI deforestation detection could be game-changing for rainforest conservation.
                </p>
                <div className="comment-actions">
                  <span className="comment-action"><i className="fas fa-reply"></i> Reply</span>
                  <span className="comment-action"><i className="fas fa-thumbs-up"></i> 3</span>
                </div>
              </div>
            </div>
            <div className="comment">
              <div className="comment-avatar">MC</div>
              <div className="comment-content">
                <div className="comment-author">Maria Chen</div>
                <p className="comment-text">
                  We need more dialogue like this between global south nations. The technology transfer potential is exciting!
                </p>
                <div className="comment-actions">
                  <span className="comment-action"><i className="fas fa-reply"></i> Reply</span>
                  <span className="comment-action"><i className="fas fa-thumbs-up"></i> 1</span>
                </div>
              </div>
            </div>
            <div className="comment">
              <div className="comment-avatar">RP</div>
              <div className="comment-content">
                <div className="comment-author">Raj Patel</div>
                <p className="comment-text">
                  The urban farming project could really help with food security in dense neighborhoods.
                </p>
                <div className="comment-actions">
                  <span className="comment-action"><i className="fas fa-reply"></i> Reply</span>
                  <span className="comment-action"><i className="fas fa-thumbs-up"></i> 2</span>
                </div>
              </div>
            </div>
            <div className="comment">
              <div className="comment-avatar">TL</div>
              <div className="comment-content">
                <div className="comment-author">Tanya Lewis</div>
                <p className="comment-text">
                  The language preservation app is such an important initiative!
                </p>
                <div className="comment-actions">
                  <span className="comment-action"><i className="fas fa-reply"></i> Reply</span>
                  <span className="comment-action"><i className="fas fa-thumbs-up"></i> 5</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-section profile-card">
            <div className="profile-avatar">JD</div>
            <h3 className="profile-name">Jane Doe</h3>
            <p className="profile-title">Community Member</p>
            <div className="profile-stats">
              <div className="stat">
                <div className="stat-value">5</div>
                <div className="stat-label">Posts</div>
              </div>
              <div className="stat">
                <div className="stat-value">720</div>
                <div className="stat-label">Upvotes</div>
              </div>
              <div className="stat">
                <div className="stat-value">12</div>
                <div className="stat-label">Replies</div>
              </div>
            </div>
            <div className="profile-tags">
              <div className="tags-container">
                <div className="tag">#GuyanaCommunity</div>
                <div className="tag">#Foodie</div>
                <div className="tag">#TechEnthusiast</div>
              </div>
            </div>
            <button className="create-post-btn">
              <i className="fas fa-plus"></i> Start a Post
            </button>
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
        <p className="footer-copyright">
          © 2023 Patwua. All voices welcome.
        </p>
      </footer>
    </>
  );
}

export default App;

