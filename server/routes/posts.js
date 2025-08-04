const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');

// Fallback content used when the database connection is unavailable
const fallbackPosts = [
  {
    _id: 'placeholder-1',
    title: 'Welcome to Patwua',
    content: 'The database connection is currently unavailable. Please try again later.'
  }
];

// Get all posts
router.get('/', async (req, res) => {
  try {
    // If MongoDB is not connected, immediately return fallback content
    if (mongoose.connection.readyState !== 1) {
      return res.json(fallbackPosts);
    }

    const { category } = req.query;
    let posts = await Post.find().sort({ createdAt: -1 });

    if (category === 'trending') {
      posts = posts.sort((a, b) => (b.votes * 2 + b.comments * 3) - (a.votes * 2 + a.comments * 3));
    } else if (category === 'following') {
      // Implement following logic based on user's follow list
    }

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Vote on a post
router.patch('/:id/vote', async (req, res) => {
  try {
    const { voteType } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.votes += voteType === 'up' ? 1 : -1;
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
