const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const postsRouter = require('../posts');
const User = require('../../models/User');
const Post = require('../../models/Post');

function sign(u) {
  return jwt.sign({ sub: u._id.toString(), email: u.email }, 'secret');
}

let app, mongod;

beforeAll(async () => {
  process.env.JWT_SECRET = 'secret';
  try {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  } catch (e) {
    console.warn('MongoMemoryServer start failed, skipping tests:', e.message);
    mongod = null;
    return;
  }
  app = express();
  app.use(express.json());
  app.use('/api/posts', postsRouter);
});

afterAll(async () => {
  if (mongod) {
    await mongoose.disconnect();
    await mongod.stop();
  }
});

const maybeIt = (name, fn) => (mongod ? it(name, fn) : it.skip(name, fn));

describe('votes and comments', () => {
  maybeIt('handles vote toggling and tallies', async () => {
    const user = await User.create({ email: 'a@a.com' });
    const post = await Post.create({ title: 't', body: 'b', authorUserId: user._id });
    let res = await request(app)
      .post(`/api/posts/${post._id}/vote`)
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ value: 1 });
    expect(res.status).toBe(200);
    expect(res.body.userVote).toBe(1);
    expect(res.body.score).toBe(1);
    res = await request(app)
      .post(`/api/posts/${post._id}/vote`)
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ value: 1 });
    expect(res.body.userVote).toBe(0);
    expect(res.body.score).toBe(0);
    res = await request(app)
      .post(`/api/posts/${post._id}/vote`)
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ value: -1 });
    expect(res.body.userVote).toBe(-1);
    expect(res.body.score).toBe(-1);
  });

  maybeIt('creates and lists comments with author', async () => {
    const user = await User.create({ email: 'b@b.com', handle: 'bob' });
    const post = await Post.create({ title: 't', body: 'b', authorUserId: user._id });
    let res = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ body: 'hi' });
    expect(res.status).toBe(201);
    expect(res.body.comment.author.handle).toBe('bob');
    res = await request(app).get(`/api/posts/${post._id}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].author.handle).toBe('bob');
  });
});
