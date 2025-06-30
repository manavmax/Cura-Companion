const { randomUUID } = require('crypto');

const User = require('../models/User');
const { hashPassword, comparePassword, isPasswordHash } = require('../utils/password');

const createUser = async (userData) => {
  console.log('Creating user with data:', userData);
  
  const hashedPassword = await hashPassword(userData.password);
  
  const user = new User({
    ...userData,
    password: hashedPassword
  });
  
  return await user.save();
};

const getByEmail = async (email) => {
  console.log('Finding user by email:', email);
  return await User.findOne({ email: email.toLowerCase() });
};

const authenticateWithPassword = async (email, password) => {
  console.log('Authenticating user:', email);
  
  const user = await getByEmail(email);
  if (!user) {
    console.log('User not found:', email);
    return null;
  }
  
  console.log('User found, comparing password...');
  console.log('Stored password hash:', user.password);
  console.log('Input password:', password);
  console.log('Is stored password a hash?', isPasswordHash(user.password));
  
  let isValid = false;
  
  // Check if the stored password is a bcrypt hash
  if (isPasswordHash(user.password)) {
    // Use bcrypt comparison for hashed passwords
    isValid = await comparePassword(password, user.password);
    console.log('Bcrypt comparison result:', isValid);
  } else {
    // Handle legacy plain text passwords
    console.log('Legacy plain text password detected, performing direct comparison');
    isValid = password === user.password;
    console.log('Plain text comparison result:', isValid);
    
    // If login is successful with plain text, hash the password for future use
    if (isValid) {
      console.log('Upgrading plain text password to bcrypt hash');
      const hashedPassword = await hashPassword(password);
      await User.findByIdAndUpdate(user._id, { password: hashedPassword });
      console.log('Password upgraded to bcrypt hash');
    }
  }
  
  if (!isValid) {
    console.log('Authentication failed for user:', email);
    return null;
  }
  
  console.log('Authentication successful for user:', email);
  return user;
};

const get = async (userId) => {
  return await User.findById(userId);
};

const list = async (filters = {}) => {
  return await User.find(filters);
};

const update = async (userId, updateData) => {
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }
  
  return await User.findByIdAndUpdate(userId, updateData, { new: true });
};

const deleteUser = async (userId) => {
  return await User.findByIdAndDelete(userId);
};

const setPassword = async (userId, newPassword) => {
  const hashedPassword = await hashPassword(newPassword);
  return await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });
};

module.exports = {
  createUser,
  list,
  get,
  getByEmail,
  update,
  delete: deleteUser,
  authenticateWithPassword,
  setPassword
};