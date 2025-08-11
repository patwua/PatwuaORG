const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Post = require('../../models/Post');
const PostDraft = require('../../models/PostDraft');
const postsRouter = require('../posts');

function sign(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET
  );
}

let app;

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  app = express();
  app.use(express.json());
  app.use('/api/posts', postsRouter);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('archive and unarchive routes', () => {
  test('denies archive for non-privileged roles', async () => {
    const postId = new mongoose.Types.ObjectId();
    const user = { _id: new mongoose.Types.ObjectId(), email: 'a@a.com', role: 'user' };

    const res = await request(app)
      .post(`/api/posts/${postId}/archive`)
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ reason: 'this reason has five words' });

    expect(res.status).toBe(403);
  });

  test('requires 5-word reason and updates archive metadata', async () => {
    const postId = new mongoose.Types.ObjectId();
    const moderator = { _id: new mongoose.Types.ObjectId(), email: 'm@b.com', role: 'moderator' };

    const updateSpy = jest
      .spyOn(Post, 'findByIdAndUpdate')
      .mockImplementation(async (id, update) => ({ _id: postId, ...update }));

    const short = await request(app)
      .post(`/api/posts/${postId}/archive`)
      .set('Authorization', `Bearer ${sign(moderator)}`)
      .send({ reason: 'too short reason' });
    expect(short.status).toBe(400);
    expect(updateSpy).not.toHaveBeenCalled();

    const reason = 'this archive reason has five words';
    const ok = await request(app)
      .post(`/api/posts/${postId}/archive`)
      .set('Authorization', `Bearer ${sign(moderator)}`)
      .send({ reason });
    expect(ok.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      postId.toString(),
      expect.objectContaining({
        status: 'archived',
        archivedReason: reason,
        archivedBy: moderator._id.toString(),
      }),
      { new: true }
    );
    expect(ok.body.post.status).toBe('archived');
    expect(ok.body.post.archivedReason).toBe(reason);
    expect(ok.body.post.archivedBy).toBe(String(moderator._id));
  });

  test('blocks unarchive for non-author non-system_admin', async () => {
    const postId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();
    jest.spyOn(Post, 'findById').mockReturnValue({ lean: () => Promise.resolve({ _id: postId, author: authorId }) });
    const updateSpy = jest.spyOn(Post, 'findByIdAndUpdate').mockResolvedValue(null);

    const admin = { _id: new mongoose.Types.ObjectId(), email: 'u@c.com', role: 'admin' };
    const res = await request(app)
      .post(`/api/posts/${postId}/unarchive`)
      .set('Authorization', `Bearer ${sign(admin)}`)
      .send();

    expect(res.status).toBe(403);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test('author or system_admin can unarchive and clears fields', async () => {
    const postId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();
    const postDoc = { _id: postId, author: authorId };
    jest.spyOn(Post, 'findById').mockReturnValue({ lean: () => Promise.resolve(postDoc) });
    const updateSpy = jest
      .spyOn(Post, 'findByIdAndUpdate')
      .mockImplementation(async (id, update) => ({ _id: postId, ...update }));

    const author = { _id: authorId, email: 'a@d.com', role: 'user' };
    let res = await request(app)
      .post(`/api/posts/${postId}/unarchive`)
      .set('Authorization', `Bearer ${sign(author)}`)
      .send();
    expect(res.status).toBe(200);
    expect(res.body.post.status).toBe('active');
    expect(res.body.post.archivedReason).toBeNull();
    expect(res.body.post.archivedAt).toBeNull();
    expect(res.body.post.archivedBy).toBeNull();
    expect(updateSpy).toHaveBeenLastCalledWith(
      postId.toString(),
      {
        status: 'active',
        archivedReason: null,
        archivedAt: null,
        archivedBy: null,
      },
      { new: true }
    );

    const sys = { _id: new mongoose.Types.ObjectId(), email: 's@d.com', role: 'system_admin' };
    res = await request(app)
      .post(`/api/posts/${postId}/unarchive`)
      .set('Authorization', `Bearer ${sign(sys)}`)
      .send();
    expect(res.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledTimes(2);
  });
});

describe('draft routes', () => {
  test('normalizes tags on save', async () => {
    const postId = new mongoose.Types.ObjectId();
    const user = { _id: new mongoose.Types.ObjectId(), email: 't@e.com', role: 'user' };

    jest
      .spyOn(Post, 'findById')
      .mockReturnValue({ lean: () => Promise.resolve({ _id: postId, author: user._id, title: 't' }) });
    jest.spyOn(PostDraft, 'findOne').mockResolvedValue(null);

    let savedTags;
    jest.spyOn(PostDraft, 'findOneAndUpdate').mockImplementation((filter, update) => {
      savedTags = update.$set.tags;
      return {
        lean: () =>
          Promise.resolve({ _id: new mongoose.Types.ObjectId(), rev: update.$set.rev, expiresAt: new Date() }),
      };
    });

    const res = await request(app)
      .put(`/api/posts/${postId}/draft`)
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ tags: ['Tag', 'tag', ' style '] });

    expect(res.status).toBe(200);
    expect(savedTags).toEqual(['tag']);
  });
});

