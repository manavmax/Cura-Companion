const mongoose = require('mongoose');

const { validatePassword, isPasswordHash } = require('../utils/password.js');
const {randomUUID} = require("crypto");

const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    validate: { validator: isPasswordHash, message: 'Invalid password hash' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  refreshToken: {
    type: String,
    unique: true,
    index: true,
    default: () => randomUUID(),
  },
  settings: {
    profile: {
      name: { type: String, default: '' },
      timezone: { type: String, default: 'America/New_York' },
      language: { type: String, default: 'en' }
    },
    notifications: {
      dailyReminders: { type: Boolean, default: true },
      moodCheckIns: { type: Boolean, default: true },
      journalPrompts: { type: Boolean, default: true },
      crisisAlerts: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: true }
    },
    privacy: {
      dataSharing: { type: Boolean, default: false },
      analytics: { type: Boolean, default: true },
      crashReports: { type: Boolean, default: true },
      locationServices: { type: Boolean, default: true }
    },
    preferences: {
      theme: { type: String, default: 'light', enum: ['light', 'dark', 'system'] },
      voiceEnabled: { type: Boolean, default: true },
      videoEnabled: { type: Boolean, default: true },
      autoSave: { type: Boolean, default: true },
      reminderTime: { type: String, default: '09:00' },
      sessionLength: { type: Number, default: 30, min: 5, max: 60 }
    }
  }
}, {
  versionKey: false,
});

schema.set('toJSON', {
  /* eslint-disable */
  transform: (doc, ret, options) => {
    delete ret.password;
    return ret;
  },
  /* eslint-enable */
});

const User = mongoose.model('User', schema);

module.exports = User;