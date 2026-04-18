const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  basicInfo: {
    age: Number,
    gender: String,
    weight: Number,
    height: Number,
  },
  medicalHistory: {
    conditions: [String],
    surgeries: [String],
    medications: [String],
    allergies: [String],
  },
  lifestyle: {
    activityLevel: String, // sedentary, active, etc.
    dietType: String,
    smoking: Boolean,
    alcohol: String,
    sleepHours: Number,
  },
  currentSymptoms: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
