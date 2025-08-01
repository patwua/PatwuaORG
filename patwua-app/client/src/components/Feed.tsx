import React, { useEffect, useState } from 'react';
import { getPosts, votePost } from '../services/api';

interface Post {
  _id: string;
  title: string;
  votes: number;
  comments: number;
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts(activeCategory);
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, [activeCategory]);

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    try {
      const updatedPost = await votePost(postId, voteType);
      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <div>
      {posts.map(post => (
        <div key={post._id}>
          <h3>{post.title}</h3>
          <p>Votes: {post.votes}</p>
          <button onClick={() => handleVote(post._id, 'up')}>Upvote</button>
          <button onClick={() => handleVote(post._id, 'down')}>Downvote</button>
        </div>
      ))}
    </div>
  );
};

export default Feed;
