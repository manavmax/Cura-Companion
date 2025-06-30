const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const requireUser = async (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE ENTRY ===');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('All Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    const authHeader = req.headers.authorization;
    console.log('Authorization Header Raw:', authHeader);

    if (!authHeader) {
      console.log('ERROR: No authorization header found');
      return res.status(401).json({ error: 'Authorization header required' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('ERROR: Invalid authorization header format:', authHeader);
      return res.status(401).json({ error: 'Bearer token required' });
    }

    const token = authHeader.substring(7);
    console.log('Token extracted length:', token ? token.length : 0);
    console.log('Token first 20 chars:', token ? token.substring(0, 20) + '...' : 'None');

    if (!token) {
      console.log('ERROR: No token found in authorization header');
      return res.status(401).json({ error: 'Token required' });
    }

    console.log('JWT_SECRET available:', process.env.JWT_SECRET ? 'Yes' : 'No');
    console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully. Full payload:', JSON.stringify(decoded, null, 2));
    } catch (jwtError) {
      console.log('JWT verification failed. Error name:', jwtError.name);
      console.log('JWT verification failed. Error message:', jwtError.message);
      return res.status(401).json({ error: 'Invalid token: ' + jwtError.message });
    }

    // Handle both 'sub' (JWT standard) and 'userId' (custom) fields
    const userId = decoded.userId || decoded.sub;
    console.log('Extracted User ID:', userId);
    console.log('User ID type:', typeof userId);

    if (!userId) {
      console.log('ERROR: No user ID found in token payload');
      console.log('Available fields in token:', Object.keys(decoded));
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    try {
      console.log('Looking up user with ID:', userId);
      const user = await User.findById(userId);
      console.log('User lookup result:', user ? 'Found' : 'Not found');
      
      if (!user) {
        console.log('ERROR: User not found for ID:', userId);
        return res.status(401).json({ error: 'User not found' });
      }

      console.log('User found - Email:', user.email);
      console.log('User found - ID:', user._id);
      req.user = user;
      console.log('=== AUTH MIDDLEWARE SUCCESS ===');
      next();
    } catch (dbError) {
      console.log('Database error finding user. Error name:', dbError.name);
      console.log('Database error finding user. Error message:', dbError.message);
      console.log('Database error stack:', dbError.stack);
      return res.status(500).json({ error: 'Database error: ' + dbError.message });
    }

  } catch (error) {
    console.log('=== AUTH MIDDLEWARE UNEXPECTED ERROR ===');
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    return res.status(500).json({ error: 'Authentication error: ' + error.message });
  }
};

module.exports = { requireUser };