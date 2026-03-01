const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const progressRoutes = require('./routes/progress');
const adminContentRoutes = require('./routes/adminContent');
const quizRoutes = require('./routes/quiz');

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const socketOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ["http://localhost:5173", "http://localhost:5175", "http://localhost:5176"];

const io = socketIo(server, {
  cors: {
    origin: socketOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : ["http://localhost:5173", "http://localhost:5175", "http://localhost:5176"];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

// Socket.io for real-time notifications
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/content', adminContentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/progress', progressRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Log environment for debugging
console.log('🔧 Starting server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);
console.log('Database URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  // Log sanitized connection string (hide password)
  const sanitized = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log('Database connection:', sanitized);
}

// Database connection and server start
db.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    // Don't sync in production, tables should already exist
    if (process.env.NODE_ENV === 'development') {
      return db.sync({ alter: false }); // Don't alter existing tables
    }
    return Promise.resolve();
  })
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}/api`);
      console.log(`📍 Health: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL}`);
    });
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err.message);
    console.error('Full error:', err);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check DATABASE_URL environment variable is set');
    console.log('2. Verify Supabase database is running');
    console.log('3. Check database credentials are correct');
    console.log('4. Ensure SSL is properly configured');
    process.exit(1);
  });

module.exports = { app, io };