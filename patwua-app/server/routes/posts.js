const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Get all posts
router.get('/', async (req, res) => {
  try {
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
