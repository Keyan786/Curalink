const mongoose = require('mongoose');

// Formalized research session schema that powers the dashboard analytics
const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
    }
  ],
  // Per-session research metadata for dashboard analytics
  sessions: [
    {
      query: { type: String },
      enrichedQuery: { type: String },
      timestamp: { type: Date, default: Date.now },
      sources: [
        {
          title: String,
          year: Number,
          provider: String,
          url: String,
          confidenceTier: String,
          relevanceScore: Number,
        }
      ],
      keywords: [String], // Extracted keywords powering Emerging Themes
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
