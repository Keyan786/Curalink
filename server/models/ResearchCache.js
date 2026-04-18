const mongoose = require('mongoose');

const researchCacheSchema = new mongoose.Schema({
  queryKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  publications: [{
    type: { type: String, default: 'publication' },
    title: String,
    abstract: String,
    authors: [String],
    year: Number,
    source: String,
    url: String,
    citations: Number,
    provider: String
  }],
  trials: [{
    type: { type: String, default: 'clinical_trial' },
    nctId: String,
    title: String,
    summary: String,
    status: String,
    phase: String,
    enrollment: Number,
    startDate: String,
    eligibility: String,
    conditions: [String],
    interventions: [String],
    locations: [String],
    contacts: [{
      name: String,
      phone: String,
      email: String
    }],
    url: String,
    provider: String
  }],
  meta: {
    totalRetrieved: Number,
    totalAfterDedup: Number,
    finalSelected: Number,
    query: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 172800 // Auto-delete after 48 hours (TTL index)
  }
});

module.exports = mongoose.model('ResearchCache', researchCacheSchema);
