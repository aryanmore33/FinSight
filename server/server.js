require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { Server } = require('socket.io');

// Middleware
const { jwtAuthMiddleware } = require('./middlewares/jwtAuthMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoute = require('./routes/dashboardRoute');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');


// Error Handler
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000; // ✅ CHANGE FROM 5000 TO 4000

// ✅ Environment-based HOST
const HOST =
  process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

// ✅ Dynamic origins
const getOriginsFromEnv = (envKey) =>
  process.env[envKey]?.split(',').map(o => o.trim()) || [];

const FRONTEND_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? getOriginsFromEnv('FRONTEND_ORIGIN_PROD')
    : getOriginsFromEnv('FRONTEND_ORIGIN_DEV');

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// ✅ Middlewares
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoute);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);



// ✅ Root route checker
app.get('/', (req, res) => {
  res.send('FinSight Backend Running ✅');
});


// ✅ Error handler (must be last)
app.use(errorHandler);

// ✅ Start server
server.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});

module.exports = app;

