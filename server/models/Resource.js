const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['therapist', 'clinic', 'support_group', 'crisis', 'online'], required: true },
  address: { type: String },
  phone: { type: String },
  website: { type: String },
  description: { type: String },
  rating: { type: Number },
  hours: { type: String },
  specialties: [{ type: String }],
  acceptsInsurance: { type: Boolean, default: false },
  cost: { type: String, enum: ['free', 'low', 'moderate', 'high'] },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  }
});

module.exports = mongoose.model('Resource', ResourceSchema); 