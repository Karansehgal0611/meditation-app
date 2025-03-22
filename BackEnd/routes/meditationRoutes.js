// routes/meditationRoutes.js
const express = require('express');
const router = express.Router();
const Meditation = require('../models/Meditation');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Start a new meditation session
router.post('/start', auth, async (req, res) => {
  try {
    const { meditationType } = req.body;
    
    // Create new meditation session
    const meditation = new Meditation({
      userId: req.user.userId,
      startTime: new Date(),
      meditationType: meditationType || 'mindfulness'
    });
    
    await meditation.save();
    
    res.status(201).json({
      success: true,
      meditation: {
        id: meditation._id,
        startTime: meditation.startTime,
        meditationType: meditation.meditationType
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// End a meditation session
router.post('/end/:id', auth, async (req, res) => {
  try {
    const meditation = await Meditation.findOne({
      _id: req.params.id,
      userId: req.user.userId,
      completed: false
    });
    
    if (!meditation) {
      return res.status(404).json({ msg: 'Meditation session not found or already completed' });
    }
    
    // End the meditation and calculate duration
    await meditation.endMeditation();
    
    // Update user streak
    const user = await User.findById(req.user.userId);
    await user.updateStreak(meditation.endTime);
    
    res.json({
      success: true,
      meditation: {
        id: meditation._id,
        startTime: meditation.startTime,
        endTime: meditation.endTime,
        duration: meditation.duration,
        meditationType: meditation.meditationType
      },
      streak: user.streak
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update meditation notes
router.patch('/notes/:id', auth, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const meditation = await Meditation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { notes },
      { new: true }
    );
    
    if (!meditation) {
      return res.status(404).json({ msg: 'Meditation session not found' });
    }
    
    res.json({
      success: true,
      meditation
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user's meditation history
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const meditations = await Meditation.find({ userId: req.user.userId })
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Meditation.countDocuments({ userId: req.user.userId });
    
    res.json({
      success: true,
      meditations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user's meditation stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Meditation.getUserStats(req.user.userId);
    const user = await User.findById(req.user.userId);
    
    res.json({
      success: true,
      stats: {
        ...stats,
        streak: user.streak
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get active meditation session if exists
router.get('/active', auth, async (req, res) => {
  try {
    const activeMeditation = await Meditation.findOne({
      userId: req.user.userId,
      completed: false
    }).sort({ startTime: -1 });
    
    res.json({
      success: true,
      hasActive: !!activeMeditation,
      meditation: activeMeditation
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;