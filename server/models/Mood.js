const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mood: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  energy: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  anxiety: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  note: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }]
}, {
  timestamps: true
});

// Index for efficient querying by user and date
moodSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Mood', moodSchema);