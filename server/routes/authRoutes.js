const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const jwt = require('jsonwebtoken');

console.log('=== AUTH ROUTES SETUP ===');

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
  console.log('=== REGISTER ROUTE HANDLER ===');
  console.log('Request body:', req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      console.log('Password too short');
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await userService.getByEmail(email);
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Create new user
    const newUser = await userService.createUser({
      email: email.toLowerCase(),
      password: password
    });

    console.log('User created successfully:', newUser._id);

    // Generate access token
    const accessToken = jwt.sign(
      { sub: newUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      user: {
        _id: newUser._id,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Error while registering user:', error);
    res.status(500).json({
      error: 'Failed to register user: ' + error.message
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  console.log('=== LOGIN ROUTE HANDLER ===');
  console.log('Request body:', req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Authenticate user
    const user = await userService.authenticateWithPassword(email, password);
    if (!user) {
      console.log('Authentication failed for user:', email);
      return res.status(400).json({
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('User logged in successfully:', user._id);

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error while logging in user:', error);
    res.status(500).json({
      error: 'Failed to login user: ' + error.message
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', async (req, res) => {
  console.log('=== LOGOUT ROUTE HANDLER ===');

  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error while logging out user:', error);
    res.status(500).json({
      error: 'Failed to logout user: ' + error.message
    });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  console.log('=== REFRESH TOKEN ROUTE HANDLER ===');
  console.log('Request body:', req.body);

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const userId = decoded.sub;

    // Check if user still exists
    const user = await userService.get(userId);
    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Token refreshed successfully for user:', user._id);

    res.json({
      accessToken
    });
  } catch (error) {
    console.error('Error while refreshing token:', error);
    res.status(401).json({
      error: 'Invalid refresh token'
    });
  }
});

console.log('=== AUTH ROUTES CONFIGURED ===');

module.exports = router;