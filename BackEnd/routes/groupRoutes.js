// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new meditation group
router.post(
  '/',
  [
    auth,
    body('name').notEmpty().trim().escape(),
    body('description').optional().trim().escape()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, weeklyGoal } = req.body;
      
      // Create new group
      const group = new Group({
        name,
        description,
        createdBy: req.user.userId,
        members: [req.user.userId],
        weeklyGoal: weeklyGoal || 0
      });
      
      await group.save();
      
      // Add group to user's groups
      await User.findByIdAndUpdate(
        req.user.userId,
        { $addToSet: { groups: group._id } }
      );
      
      res.status(201).json({
        success: true,
        group
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Get all groups for the current user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const groups = await Group.find({ _id: { $in: user.groups } })
      .populate('members', 'username')
      .populate('createdBy', 'username');
    
    res.json({
      success: true,
      groups
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a specific group by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'username')
      .populate('createdBy', 'username');
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is a member of this group
    const isMember = group.members.some(
      member => member._id.toString() === req.user.userId
    );
    
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to view this group' });
    }
    
    res.json({
      success: true,
      group
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Join a group using join code
router.post(
  '/join',
  [
    auth,
    body('joinCode').notEmpty().trim().escape()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { joinCode } = req.body;
      
      // Find group by join code
      const group = await Group.findOne({ joinCode });
      
      if (!group) {
        return res.status(404).json({ msg: 'Invalid join code' });
      }
      
      // Check if group is full
      if (group.isFull()) {
        return res.status(400).json({ msg: 'This group is already full' });
      }
      
      // Check if user is already a member
      const isMember = group.members.includes(req.user.userId);
      if (isMember) {
        return res.status(400).json({ msg: 'You are already a member of this group' });
      }
      
      // Add user to group
      await group.addMember(req.user.userId);
      
      // Add group to user's groups
      await User.findByIdAndUpdate(
        req.user.userId,
        { $addToSet: { groups: group._id } }
      );
      
      res.json({
        success: true,
        group
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Leave a group
router.post('/leave/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is a member
    const isMember = group.members.includes(req.user.userId);
    if (!isMember) {
      return res.status(400).json({ msg: 'You are not a member of this group' });
    }
    
    // Remove user from group
    group.members = group.members.filter(
      memberId => memberId.toString() !== req.user.userId
    );
    
    await group.save();
    
    // Remove group from user's groups
    await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { groups: group._id } }
    );
    
    res.json({
      success: true,
      msg: 'Successfully left the group'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get group meditation progress
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is a member
    const isMember = group.members.includes(req.user.userId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to view this group' });
    }
    
    // Get group progress stats
    const progress = await Group.getGroupProgress(req.params.id);
    
    res.json({
      success: true,
      groupName: group.name,
      members: progress
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update group settings (only creator can do this)
router.put(
  '/:id',
  [
    auth,
    body('name').optional().notEmpty().trim().escape(),
    body('description').optional().trim().escape(),
    body('weeklyGoal').optional().isNumeric()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const group = await Group.findById(req.params.id);
      
      if (!group) {
        return res.status(404).json({ msg: 'Group not found' });
      }
      
      // Check if user is the creator
      if (group.createdBy.toString() !== req.user.userId) {
        return res.status(403).json({ msg: 'Only the group creator can update settings' });
      }
      
      const { name, description, weeklyGoal } = req.body;
      
      // Update fields
      if (name) group.name = name;
      if (description !== undefined) group.description = description;
      if (weeklyGoal !== undefined) group.weeklyGoal = weeklyGoal;
      
      await group.save();
      
      res.json({
        success: true,
        group
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;