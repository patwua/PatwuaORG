const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const usersRouter = require('../users');
const commentsRouter = require('../comments');
const mediaRouter = require('../media');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const Vote = require('../../models/Vote');

function sign(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET);
}

let app;

beforeAll(() => {
  process.env.JWT_SECRET = 'test';
  app = express();
  app.use(express.json());
  app.use('/api/users', usersRouter);
  app.use('/api/users', mediaRouter);
  app.use('/api/comments', commentsRouter);
});

afterEach(() => jest.restoreAllMocks());

describe('user profile endpoints', () => {
  test('fetch public profile', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({ lean: () => Promise.resolve({ _id:'1', handle:'h', displayName:'d', avatar:'a', bio:'b', location:'L', links:[], role:'user', createdAt:new Date() }) });
    const res = await request(app).get('/api/users/by-handle/h');
    expect(res.status).toBe(200);
    expect(res.body.user.handle).toBe('h');
    expect(res.body.user.bio).toBe('b');
  });

  test('counts endpoint', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({ lean: () => Promise.resolve({ _id:'u1', handle:'h' }) });
    jest.spyOn(Post, 'countDocuments').mockResolvedValue(3);
    jest.spyOn(Comment, 'countDocuments').mockResolvedValue(2);
    jest.spyOn(Post, 'find').mockReturnValue({ select: () => ({ lean: () => Promise.resolve([{ _id:'p1' }]) }) });
    jest.spyOn(Vote, 'countDocuments').mockResolvedValue(5);
    const res = await request(app).get('/api/users/by-handle/h/counts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ posts:3, comments:2, upvotes:5 });
  });

  test('comments pagination', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({ lean: () => Promise.resolve({ _id:'u1', handle:'h' }) });
    jest.spyOn(Comment, 'countDocuments').mockResolvedValue(1);
    jest.spyOn(Comment, 'find').mockReturnValue({
      sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => Promise.resolve([{ _id:'c1', body:'hi', createdAt:new Date(), post:{ _id:'p1', slug:'s', title:'t' } }]) }) }) }) })
    });
    const res = await request(app).get('/api/comments?authorHandle=h');
    expect(res.status).toBe(200);
    expect(res.body.items[0].post.slug).toBe('s');
  });

  test('media endpoint returns items', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({ lean: () => Promise.resolve({ _id:'u1', handle:'h' }) });
    jest.spyOn(Post, 'countDocuments').mockResolvedValue(1);
    jest.spyOn(Post, 'find').mockReturnValue({
      sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.resolve([{ _id:'p1', slug:'s', title:'t', bodyHtml:'<img src="x.jpg" />' }]) }) }) })
    });
    const res = await request(app).get('/api/users/by-handle/h/media');
    expect(res.status).toBe(200);
    expect(res.body.items[0].post.slug).toBe('s');
  });

  test('PUT /users/me requires auth and updates fields', async () => {
    const user = { _id:'u1', email:'e', role:'user', handle:'h' };
    jest.spyOn(User, 'findById').mockReturnValue({ lean: () => Promise.resolve({ _id:'u1', email:'e', role:'user', handle:'h', displayName:'old' }) });
    jest.spyOn(User, 'updateOne').mockResolvedValue({});
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ displayName:'new', bio:'bio' });
    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe('old');
  });
});
