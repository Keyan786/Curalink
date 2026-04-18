const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const router = express.Router();

// Get user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const profile = await HealthProfile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update or create profile (Onboarding)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const profileData = {
      ...req.body,
      userId: req.userId,
      updatedAt: Date.now(),
    };

    let profile = await HealthProfile.findOne({ userId: req.userId });
    if (profile) {
      profile = await HealthProfile.findOneAndUpdate(
        { userId: req.userId },
        { $set: profileData },
        { new: true }
      );
    } else {
      profile = new HealthProfile(profileData);
      await profile.save();
      // Update user onboarded status
      await User.findByIdAndUpdate(req.userId, { onboarded: true });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
