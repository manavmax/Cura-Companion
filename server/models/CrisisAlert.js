const mongoose = require('mongoose');

const crisisAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  summary: String,
  source: String, // e.g., 'mood', 'journal', 'chat'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CrisisAlert', crisisAlertSchema); 