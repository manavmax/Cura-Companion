const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mood: {
    type: Number,
    min: 1,
    max: 10
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  type: {
    type: String,
    enum: ['text', 'voice'],
    required: true,
    default: 'text'
  },
  audioUrl: {
    type: String,
    trim: true
  },
  wordCount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying by user and date
journalSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Journal', journalSchema);