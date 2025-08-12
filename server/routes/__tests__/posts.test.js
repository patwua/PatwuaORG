const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Post = require('../../models/Post');
const PostDraft = require('../../models/PostDraft');
const postsRouter = require('../posts');
const tagsRouter = require('../tags');
const Persona = require('../../models/Persona');
const User = require('../../models/User');

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
  app.use('/api/tags', tagsRouter);
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

  test('publishing draft merges saved tags with hashtags', async () => {
    const postId = new mongoose.Types.ObjectId();
    const user = { _id: new mongoose.Types.ObjectId(), email: 't@e.com', role: 'user' };

    const draft = { _id: new mongoose.Types.ObjectId(), content: '<p>#Hello world</p>', tags: ['custom'] };
    jest.spyOn(PostDraft, 'findOne').mockResolvedValue(draft);
    jest.spyOn(PostDraft, 'deleteOne').mockResolvedValue({});

    const postDoc = { _id: postId, author: user._id, save: jest.fn().mockResolvedValue(true), body: '', title: 't' };
    jest.spyOn(Post, 'findById').mockResolvedValue(postDoc);
    const updateSpy = jest.spyOn(Post, 'findByIdAndUpdate').mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/posts/${postId}/draft/publish`)
      .set('Authorization', `Bearer ${sign(user)}`)
      .send();

    expect(res.status).toBe(200);
    expect(postDoc.tags).toEqual(expect.arrayContaining(['custom', 'hello']));

    await new Promise(r => setImmediate(r));
    const finalTags = updateSpy.mock.calls[0][1].tags;
    expect(finalTags).toEqual(expect.arrayContaining(['custom', 'hello']));
  });
});

describe('preview route', () => {
  test('returns 400 for invalid MJML input', async () => {
    const user = { _id: new mongoose.Types.ObjectId(), email: 'p@e.com', role: 'user' };

    const res = await request(app)
      .post('/api/posts/preview')
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ content: '<mjml><mj-body><mj-txt>bad</mj-txt></mj-body></mjml>' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/MJML error/);
  });
});

describe('create route', () => {
  test('falls back to user info when personaId is invalid', async () => {
    const user = { _id: new mongoose.Types.ObjectId(), email: 'u@test.com', role: 'user' };

    jest
      .spyOn(Persona, 'findOne')
      .mockReturnValue({ lean: () => Promise.resolve(null) });
    jest
      .spyOn(User, 'findById')
      .mockReturnValue({
        lean: () =>
          Promise.resolve({ _id: user._id, displayName: 'UserDisp', avatar: 'a.png', email: user.email }),
      });
    jest.spyOn(Post, 'findByIdAndUpdate').mockResolvedValue(null);

    const createSpy = jest.spyOn(Post, 'create').mockImplementation(async payload => ({
      _id: new mongoose.Types.ObjectId().toString(),
      slug: 'slug',
      ...payload,
    }));

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ title: 'hello', body: 'body', personaId: new mongoose.Types.ObjectId().toString() });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].personaName).toBe('UserDisp');
    expect(res.body.post.personaName).toBe('UserDisp');
    expect(res.body.post.personaAvatar).toBe('a.png');
  });

  test('extracts hashtags and tag endpoint lists the post', async () => {
    const user = { _id: new mongoose.Types.ObjectId(), email: 't@e.com', role: 'user' };

    jest
      .spyOn(Persona, 'findOne')
      .mockReturnValue({ lean: () => Promise.resolve(null) });
    jest
      .spyOn(User, 'findById')
      .mockReturnValue({ lean: () => Promise.resolve({ _id: user._id, email: user.email }) });

    let created;
    const createSpy = jest.spyOn(Post, 'create').mockImplementation(async payload => {
      created = { _id: new mongoose.Types.ObjectId().toString(), slug: 'welcome', ...payload };
      return created;
    });
    jest.spyOn(Post, 'findByIdAndUpdate').mockResolvedValue(null);

    const findFilters = [];
    jest.spyOn(Post, 'find').mockImplementation(filter => {
      findFilters.push(filter);
      return {
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([created]),
          }),
        }),
      };
    });

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ title: 'Hello', body: 'Hi #WeArePatwua' });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].tags).toEqual(['wearepatwua']);

    await new Promise(r => setImmediate(r));

    const tagMixed = await request(app).get('/api/tags/WeArePatwua');
    expect(tagMixed.status).toBe(200);
    expect(tagMixed.body.tag).toBe('wearepatwua');
    expect(tagMixed.body.posts[0].title).toBe('Hello');

    const tagLower = await request(app).get('/api/tags/wearepatwua');
    expect(tagLower.status).toBe(200);
    expect(tagLower.body.tag).toBe('wearepatwua');
    expect(tagLower.body.posts[0].title).toBe('Hello');

    expect(findFilters).toEqual([
      expect.objectContaining({ tags: 'wearepatwua', status: 'active' }),
      expect.objectContaining({ tags: 'wearepatwua', status: 'active' }),
    ]);
  });

  test.each(['body', 'content'])('accepts %s field for plain text bodies', async field => {
    const user = { _id: new mongoose.Types.ObjectId(), email: 'c@e.com', role: 'user' };

    jest
      .spyOn(Persona, 'findOne')
      .mockReturnValue({ lean: () => Promise.resolve(null) });
    jest
      .spyOn(User, 'findById')
      .mockReturnValue({ lean: () => Promise.resolve({ _id: user._id, email: user.email }) });
    jest.spyOn(Post, 'findByIdAndUpdate').mockResolvedValue(null);

    const createSpy = jest.spyOn(Post, 'create').mockImplementation(async payload => ({
      _id: new mongoose.Types.ObjectId().toString(),
      slug: 'slug',
      ...payload,
    }));

    const text = 'Line one\n\nLine two\nLine three';
    const payload = { title: 'Hello', [field]: text };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${sign(user)}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].body).toBe(text);
  });

  test('accepts MJML content for body', async () => {
    const user = { _id: new mongoose.Types.ObjectId(), email: 'm@j.com', role: 'user' };

    jest
      .spyOn(Persona, 'findOne')
      .mockReturnValue({ lean: () => Promise.resolve(null) });
    jest
      .spyOn(User, 'findById')
      .mockReturnValue({ lean: () => Promise.resolve({ _id: user._id, email: user.email }) });
    jest.spyOn(Post, 'findByIdAndUpdate').mockResolvedValue(null);

    const createSpy = jest.spyOn(Post, 'create').mockImplementation(async payload => ({
      _id: new mongoose.Types.ObjectId().toString(),
      slug: 'slug',
      ...payload,
    }));

    const mjml = '<mjml><mj-body><mj-section><mj-column><mj-text>Hello</mj-text></mj-column></mj-section></mj-body></mjml>';

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ title: 'Hello', content: mjml });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].format).toBe('mjml');
    expect(createSpy.mock.calls[0][0].body).toBe('Hello');
    expect(createSpy.mock.calls[0][0].bodyHtml).toContain('<html');
  });

  test('rejects invalid MJML content', async () => {
    const user = { _id: new mongoose.Types.ObjectId(), email: 'b@a.com', role: 'user' };

    jest
      .spyOn(Persona, 'findOne')
      .mockReturnValue({ lean: () => Promise.resolve(null) });
    jest
      .spyOn(User, 'findById')
      .mockReturnValue({ lean: () => Promise.resolve({ _id: user._id, email: user.email }) });

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${sign(user)}`)
      .send({ title: 'Oops', content: '<mjml><mj-body><mj-txt>bad</mj-txt></mj-body></mjml>' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/MJML error/);
  });
});

