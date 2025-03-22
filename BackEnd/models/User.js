// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Don't return password in queries
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  // For tracking user goals and preferences
  dailyGoal: {
    type: Number,
    default: 15 // Default goal: 15 minutes of meditation per day
  },
  preferredMeditationType: {
    type: String,
    enum: ['focus', 'loving-kindness', 'mindfulness', 'gratitude', 'other'],
    default: 'mindfulness'
  },
  streak: {
    type: Number,
    default: 0 // Number of consecutive days with meditation
  },
  lastMeditationDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT
UserSchema.methods.createJWT = function() {
  return jwt.sign(
    { userId: this._id, username: this.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME || '30d' }
  );
};

// Method to update streak
UserSchema.methods.updateStreak = async function(meditationDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const meditationDay = new Date(meditationDate);
  meditationDay.setHours(0, 0, 0, 0);
  
  // If this is the first meditation ever
  if (!this.lastMeditationDate) {
    this.streak = 1;
    this.lastMeditationDate = meditationDate;
    return this.save();
  }
  
  const lastDate = new Date(this.lastMeditationDate);
  lastDate.setHours(0, 0, 0, 0);
  
  // If meditation was already done today
  if (meditationDay.getTime() === lastDate.getTime()) {
    return this;
  }
  
  // If meditation was done yesterday, increment streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastDate.getTime() === yesterday.getTime()) {
    this.streak += 1;
  } else {
    // Streak broken, start over
    this.streak = 1;
  }
  
  this.lastMeditationDate = meditationDate;
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);