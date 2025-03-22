// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register a new user
router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create new user
      user = new User({
        username,
        email,
        password
      });

      await user.save();

      // Generate JWT
      const token = user.createJWT();

      res.status(201).json({ 
        user: { 
          id: user._id,
          username: user.username,
          email: user.email,
          groups: user.groups,
          dailyGoal: user.dailyGoal,
          streak: user.streak
        },
        token 
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user by email and include the password for verification
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Generate JWT
      const token = user.createJWT();

      res.json({ 
        user: { 
          id: user._id,
          username: user.username,
          email: user.email,
          groups: user.groups,
          dailyGoal: user.dailyGoal,
          streak: user.streak
        },
        token 
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  const { dailyGoal, preferredMeditationType } = req.body;
  
  // Build update object
  const updateFields = {};
  if (dailyGoal !== undefined) updateFields.dailyGoal = dailyGoal;
  if (preferredMeditationType) updateFields.preferredMeditationType = preferredMeditationType;
  
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;