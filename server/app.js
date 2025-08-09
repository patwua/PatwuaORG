require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const setupWebSocket = require('./websocket');

const app = express();

// CORS: allow the deployed client (fallback to * for early boot)
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(
  cors({
    origin: (origin, cb) => cb(null, allowedOrigin === '*' ? true : origin === allowedOrigin),
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Root route for basic health check
app.get('/', (req, res) => {
  res.send('Patwua API is running');
});

// HEALTHCHECK (optional but useful for Render)
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

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
app.use('/api/posts', require('./routes/posts'));
app.use('/api/auth', require('./routes/auth'));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
setupWebSocket(server);
