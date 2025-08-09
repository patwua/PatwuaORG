require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const setupWebSocket = require('./websocket');
const authRoutes = require('./routes/auth');
const personaRoutes = require('./routes/personas');
const postsRoutes   = require('./routes/posts');
const reviewRoutes = require('./routes/review');

const app = express();
const allowed = process.env.ALLOWED_ORIGIN;

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // allow server-to-server / curl
    cb(null, origin === allowed); // exact match only
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight
app.use(express.json());

app.get('/healthz', (_req, res) => res.send('ok'));

// Root route for basic health check
app.get('/', (req, res) => {
  res.send('Patwua API is running');
});

// MongoDB Connection
const mongoURI =
  process.env.MONGO_URI ||
  'mongodb+srv://patwuablogR2:zngaG3RbC6MPPIEL@cluster0.bvvnnry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

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
app.use('/api/review', reviewRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
setupWebSocket(server);
