require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Environment Validation
const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Startup Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT;

// Middleware - Security & Logging
app.use(helmet()); // Set security HTTP headers
app.use(cors()); // Enable CORS for frontend
app.use(morgan('dev')); // HTTP request logger
app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body

// Rate Limiting to prevent API abuse
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again in 15 minutes!'
});
app.use('/api', limiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  const isDbConnected = require('mongoose').connection.readyState === 1;
  res.status(200).json({
    status: 'healthy',
    database: isDbConnected ? 'connected' : 'disconnected',
    server: 'running'
  });
});

// Import Routes
const userRoutes = require('./routes/v1/users');
const projectRoutes = require('./routes/v1/projects');
const maintainerRoutes = require('./routes/v1/maintainers');
const meetingRequestRoutes = require('./routes/v1/meetingRequests');

// Register Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/maintainers', maintainerRoutes);
app.use('/api/v1/meeting-requests', meetingRequestRoutes);

// Database Connection & Server Start
connectDB().then(() => {
  console.log('✓ Environment Loaded');
  app.listen(PORT, () => {
    console.log('✓ Routes Registered');
    console.log(`✓ Server Running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server due to database connection error');
  process.exit(1);
});
