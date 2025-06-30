const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'ai']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    default: 'text',
    enum: ['text', 'voice', 'crisis']
  }
}, { _id: true });

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mode: {
    type: String,
    required: true,
    enum: ['text', 'voice', 'video'],
    default: 'text'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  messages: [messageSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  sessionType: {
    type: String,
    default: 'therapy',
    enum: ['therapy', 'crisis', 'general']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Index for efficient queries
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ status: 1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;