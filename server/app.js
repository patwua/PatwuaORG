require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const setupWebSocket = require('./websocket');
const authRoutes = require('./routes/auth');
const personaRoutes = require('./routes/personas');
const postsRoutes   = require('./routes/posts');
const tagsRoutes    = require('./routes/tags');
const reviewRoutes = require('./routes/review');
const usersRoutes  = require('./routes/users');

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

mongoose
  .connect(mongoURI, { dbName: mongoDBName })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/users', usersRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
setupWebSocket(server);
