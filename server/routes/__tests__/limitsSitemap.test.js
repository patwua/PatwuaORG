const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const postsRouter = require('../posts');
const sitemapRouter = require('../sitemap');
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
  app.use('/', sitemapRouter);
});

afterAll(async () => {
  if (mongod) {
    await mongoose.disconnect();
    await mongod.stop();
  }
});

const maybeIt = (name, fn) => (mongod ? it(name, fn) : it.skip(name, fn));

maybeIt('rate limits votes', async () => {
  const user = await User.create({ email: 'a@a.com' });
  const post = await Post.create({ title: 't', body: 'b', authorUserId: user._id });
  let res;
  for (let i = 0; i < 61; i++) {
    res = await request(app)
      .post(`/api/posts/${post._id}/vote`)
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ value: 1 });
  }
  expect(res.status).toBe(429);
  expect(res.body.error).toMatch(/Too many/);
});

maybeIt('serves sitemap with urls', async () => {
  const user = await User.create({ email: 'b@b.com', handle: 'bob' });
  await Post.create({ title: 'p', body: 'b', authorUserId: user._id });
  const res = await request(app).get('/sitemap.xml');
  expect(res.status).toBe(200);
  expect(res.text).toContain('<url>');
});
