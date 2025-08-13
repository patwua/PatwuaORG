require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const setupWebSocket = require('./websocket');
const { runOnce } = require('./utils/migrate');
const authRoutes = require('./routes/auth');
const postsRoutes   = require('./routes/posts');
const tagsRoutes    = require('./routes/tags');
const reviewRoutes = require('./routes/review');
const usersRoutes  = require('./routes/users');
const commentsRoutes = require('./routes/comments');
const mediaRoutes = require('./routes/media');
const redirectRoutes = require('./routes/redirects');
const PostDraft = require('./models/PostDraft');

const app = express();

// CORS: front-end origin
const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://patwuaorg.onrender.com';
app.use(cors({
  origin: ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/healthz', (_req, res) => res.send('ok'));

// Root route for basic health check
app.get('/', (req, res) => {
  res.send('Patwua API is running');
});

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI
if (!mongoURI) {
  console.error('Missing MONGODB_URI/MONGO_URI env var')
  process.exit(1)
}
// Explicitly specify the database name to avoid authentication errors when the
// connection string does not include one. This value can be overridden via the
// MONGODB_DB environment variable.
const mongoDBName = process.env.MONGODB_DB || 'patwua';

async function runBootMigrations() {
  if (String(process.env.AUTO_RUN_MIGRATIONS || 'true') !== 'true') {
    console.log('[migrations] AUTO_RUN_MIGRATIONS=false, skipping boot migrations')
    return
  }
  const db = mongoose.connection.db
  const key = '2025-08-drop-path-index-and-author-migration'

  await runOnce(db, key, async () => {
    const posts = db.collection('posts')

    const idx = await posts.indexes()
    const pathIdx = idx.find(i => i.name === 'path_1' || (i.key && i.key.path === 1))
    if (pathIdx) {
      try {
        await posts.dropIndex(pathIdx.name)
        console.log('[migrations] Dropped posts index:', pathIdx.name)
      } catch (e) {
        console.warn('[migrations] Could not drop path index:', e.message)
      }
    }

    try {
      const r = await posts.updateMany({ path: { $exists: true } }, { $unset: { path: "" } })
      if (r.modifiedCount) console.log('[migrations] Unset path on docs:', r.modifiedCount)
    } catch (e) {
      console.warn('[migrations] Unset path failed:', e.message)
    }

    try {
      const res1 = await posts.updateMany(
        { authorUserId: { $exists: false }, author: { $type: 'objectId' } },
        [{ $set: { authorUserId: '$author' } }, { $unset: 'author' }]
      )
      if (res1.modifiedCount) {
        console.log('[migrations] Migrated author → authorUserId:', res1.modifiedCount)
      } else {
        const res2 = await posts.updateMany(
          { authorUserId: { $exists: false }, author: { $type: 'objectId' } },
          { $set: { authorUserId: '$author' } }
        )
        if (res2.modifiedCount) {
          await posts.updateMany({ authorUserId: { $exists: true }, author: { $exists: true } }, { $unset: { author: "" } })
          console.log('[migrations] Migrated author → authorUserId (fallback):', res2.modifiedCount)
        }
      }
    } catch (e) {
      console.warn('[migrations] author → authorUserId migration failed:', e.message)
    }

    try {
      await posts.createIndex(
        { slug: 1 },
        {
          name: 'slug_unique_partial',
          unique: true,
          partialFilterExpression: { slug: { $exists: true, $ne: null } },
        }
      )
      await posts.createIndex({ authorUserId: 1, createdAt: -1 }, { name: 'author_createdAt' })
      await posts.createIndex({ status: 1, createdAt: -1 }, { name: 'status_createdAt' })
      console.log('[migrations] Ensured indexes: slug_unique_partial, author_createdAt, status_createdAt')
    } catch (e) {
      console.warn('[migrations] Index creation issue:', e.message)
    }
  })
}

mongoose
  .connect(mongoURI, { dbName: mongoDBName })
  .then(() => {
    console.log('Connected to MongoDB')
    runBootMigrations().catch(e => console.error('[migrations] Boot migration fatal:', e))
    const hours = Number(process.env.DRAFT_TTL_HOURS || 72)
    setInterval(async () => {
      try {
        const cutoff = new Date(Date.now() - hours * 3600 * 1000)
        const { deletedCount } = await PostDraft.deleteMany({ updatedAt: { $lt: cutoff } })
        if (deletedCount) console.log(`Purged ${deletedCount} stale drafts`)
      } catch (e) {
        console.error('Draft cleanup error', e)
      }
    }, 60 * 60 * 1000)
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/users', mediaRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/', redirectRoutes);

// Error handling (must be registered after all routes)
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  const server = app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
  setupWebSocket(server);
}

module.exports = { app, runBootMigrations };
