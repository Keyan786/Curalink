const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const HealthProfile = require('../models/HealthProfile');
const axios = require('axios');
const router = express.Router();

const HF_API_URL = process.env.HF_API_URL || 'https://router.huggingface.co/v1/chat/completions';
const MODEL = process.env.HF_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';

// Generate Daily Routine and Insights
router.get('/', authMiddleware, async (req, res) => {
  try {
    const profile = await HealthProfile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // We can use the AI to generate a personalized routine and insights
    const prompt = `Based on the following user health profile, generate:
1. A structured Daily Routine (with meal times, hydration, activity, and sleep).
2. Three actionable health tips.

User Profile:
- Age: ${profile.basicInfo.age}
- Gender: ${profile.basicInfo.gender}
- Conditions: ${profile.medicalHistory.conditions.join(', ') || 'None'}
- Lifestyle: ${profile.lifestyle.dietType} diet, ${profile.lifestyle.activityLevel} activity.
- Current symptoms: ${profile.currentSymptoms.join(', ') || 'None'}

Format the response as JSON with keys "routine" (array of {time, activity}) and "tips" (array of strings). 
Return ONLY the JSON.`;

    const response = await axios.post(HF_API_URL, {
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const outputText = response.data.choices[0].message.content.trim();
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in output');

    const insights = JSON.parse(jsonMatch[0]);
    res.json(insights);
  } catch (err) {
    console.error('Insights Error:', err.message);
    // Fallback if AI fails
    res.json({
      routine: [
        { time: '07:00 AM', activity: 'Wake up and Hydrate' },
        { time: '08:30 AM', activity: 'Nutritious Breakfast' },
        { time: '12:30 PM', activity: 'Balanced Lunch' },
        { time: '05:00 PM', activity: 'Light Physical Activity' },
        { time: '07:30 PM', activity: 'Lighter Dinner' },
        { time: '10:00 PM', activity: 'Sleep' },
      ],
      tips: [
        'Stay hydrated throughout the day.',
        'Incorporate more leafy greens into your diet.',
        'Try 10 minutes of deep breathing before bed.'
      ]
    });
  }
});

module.exports = router;
