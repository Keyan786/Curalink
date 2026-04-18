const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const HealthProfile = require('../models/HealthProfile');
const ChatHistory = require('../models/ChatHistory');
const { aggregateResearch } = require('../services/researchAggregator');
const router = express.Router();

const HF_API_URL = process.env.HF_API_URL || 'https://router.huggingface.co/v1/chat/completions';
const MODEL = process.env.HF_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    let history = await ChatHistory.findOne({ userId: req.userId });
    if (!history) {
      history = new ChatHistory({ userId: req.userId, messages: [] });
      await history.save();
    }
    res.json(history.messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Post a message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const profile = await HealthProfile.findOne({ userId: req.userId });

    if (!profile) return res.status(400).json({ message: 'Please complete onboarding first' });

    // Step 1: Kick off research retrieval in parallel with prompt preparation
    const researchPromise = aggregateResearch(message, profile).catch(err => {
      console.error('Research aggregation failed (non-blocking):', err.message);
      return { publications: [], trials: [], meta: {} };
    });

    // Step 2: Build context-aware system prompt
    const systemPrompt = `You are Curalink, a personalized AI health mentor.
User Profile:
- Basic Info: ${profile.basicInfo.age} years old, ${profile.basicInfo.gender}.
- Conditions: ${profile.medicalHistory.conditions.join(', ') || 'None'}.
- Lifestyle: ${profile.lifestyle.dietType} diet, ${profile.lifestyle.activityLevel} activity level.
- Current symptoms: ${profile.currentSymptoms.join(', ') || 'None'}.

Instructions:
1. Provide safe, natural, and non-prescriptive wellness advice.
2. DO NOT diagnose or recommend specific medications.
3. Focus on diet, lifestyle, and preventive care.
4. If a symptom sounds serious, ALWAYS advise consulting a professional.
5. Keep responses supportive, clear, and empathetic.
6. Use the user's profile to tailor your advice.
7. When you mention information from a publication, you MUST append a citation exactly in this format at the end of the sentence: [[YYYY|URL]] using the specific Year and URL provided in the RESEARCH CONTEXT.
8. DO NOT use any markdown formatting like **bold** or *italics*. Respond in plain text only.

RESEARCH CONTEXT (use to enhance your response):
{RESEARCH_PLACEHOLDER}`;

    // Step 3: Wait for research results
    const research = await researchPromise;

    // Step 4: Build a research summary to inject into the system prompt
    let researchContext = '';
    if (research.publications.length > 0) {
      researchContext += 'RELEVANT PUBLICATIONS:\n';
      research.publications.forEach((pub, i) => {
        researchContext += `${i + 1}. "${pub.title}" (Year: ${pub.year || 'N/A'}, URL: ${pub.url}) - ${pub.source}. `;
        if (pub.abstract) researchContext += `Summary: ${pub.abstract.slice(0, 200)}`;
        researchContext += '\n';
      });
    }
    if (research.trials.length > 0) {
      researchContext += '\nRELEVANT CLINICAL TRIALS:\n';
      research.trials.forEach((trial, i) => {
        researchContext += `${i + 1}. "${trial.title}" - Status: ${trial.status}. `;
        if (trial.summary) researchContext += `Summary: ${trial.summary.slice(0, 200)}`;
        researchContext += '\n';
      });
    }
    if (!researchContext) {
      researchContext = 'No specific research data was retrieved for this query.';
    }

    const finalSystemPrompt = systemPrompt.replace('{RESEARCH_PLACEHOLDER}', researchContext);

    // Step 5: Prepare chat history
    let history = await ChatHistory.findOne({ userId: req.userId });
    if (!history) {
      history = new ChatHistory({ userId: req.userId, messages: [] });
    }

    history.messages.push({ role: 'user', content: message });

    // Keep only last 20 messages for context window management
    const recentMessages = history.messages.slice(-20);

    // Step 6: Call Hugging Face Inference Router (OpenAI Compatible)
    const response = await axios.post(HF_API_URL, {
      model: MODEL,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        ...recentMessages.map(m => ({ role: m.role, content: m.content }))
      ],
      max_tokens: 800,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const botMessage = response.data.choices[0].message.content.replace(/\*\*/g, '').trim();

    history.messages.push({ role: 'assistant', content: botMessage });
    await history.save();

    // Step 7: Return response with research data attached
    res.json({
      reply: botMessage,
      history: history.messages,
      research: {
        publications: research.publications,
        trials: research.trials,
        meta: research.meta
      }
    });
  } catch (err) {
    console.error('HF Chat Error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to connect to AI mentor via Hugging Face. Check API token and model status.' });
  }
});

module.exports = router;
