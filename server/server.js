// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const basicRoutes = require("./routes/index");
const authRoutes = require("./routes/authRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const moodRoutes = require("./routes/moodRoutes");
const journalRoutes = require("./routes/journalRoutes");
const chatRoutes = require("./routes/chatRoutes");
const crisisRoutes = require("./routes/crisisRoutes");
const emergencyContactRoutes = require("./routes/emergencyContactRoutes");
const alertRoutes = require('./routes/alertRoutes');
const { connectDB } = require("./config/database");
const cors = require("cors");

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

console.log(`Starting server with PID: ${process.pid}`);
console.log(`Node.js version: ${process.version}`);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle SIGTERM and SIGINT gracefully
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Pretty-print JSON responses
app.enable('json spaces');
app.enable('strict routing');

console.log('Setting up middleware...');
app.use(cors({}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Simple request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Setup routes FIRST, before database connection
console.log('Setting up routes...');
try {
  console.log('Setting up basic routes...');
  app.use(basicRoutes);

  console.log('Setting up auth routes...');
  app.use('/api/auth', authRoutes);

  console.log('Setting up settings routes...');
  app.use('/api/settings', settingsRoutes);

  console.log('Setting up mood routes...');
  app.use('/api/moods', moodRoutes);

  console.log('Setting up journal routes...');
  app.use('/api/journal-entries', journalRoutes);

  console.log('Setting up chat routes...');
  app.use('/api/chat-sessions', chatRoutes);

  console.log('Setting up crisis routes...');
  app.use('/api/crisis', crisisRoutes);

  console.log('Setting up emergency contact routes...');
  app.use('/api', emergencyContactRoutes);

  console.log('Setting up alert routes...');
  app.use('/api/alert', alertRoutes);

  console.log('Setting up uploads directory...');
  app.use('/uploads', express.static('uploads'));

  console.log('All routes configured successfully');
} catch (routeError) {
  console.error('Error setting up routes:', routeError);
  console.error('Route error stack:', routeError.stack);
  process.exit(1);
}

// Error handling
app.use((req, res, next) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).send("Page not found.");
});

app.use((err, req, res, next) => {
  console.error(`Application error: ${err.message}`);
  console.error('Error stack:', err.stack);
  res.status(500).send("There was an error serving your request.");
});

// Start server function
async function startServer() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connection successful');

    console.log('Starting HTTP server...');
    const server = app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log(`Server started successfully at ${new Date().toISOString()}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server startup error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use.`);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
let server;
startServer().then((serverInstance) => {
  server = serverInstance;
});

// Graceful shutdown function
function gracefulShutdown() {
  console.log('Starting graceful shutdown...');

  if (server) {
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
      } else {
        console.log('HTTP server closed.');
      }

      mongoose.connection.close(false, (err) => {
        if (err) {
          console.error('Error during MongoDB shutdown:', err);
        } else {
          console.log('MongoDB connection closed.');
        }
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}