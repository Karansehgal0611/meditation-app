// models/Meditation.js
const mongoose = require('mongoose');

const MeditationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 0 // Duration in minutes
  },
  completed: {
    type: Boolean,
    default: false
  },
  // Optional fields for enhancing the meditation experience
  meditationType: {
    type: String,
    enum: ['focus', 'loving-kindness', 'mindfulness', 'gratitude', 'other'],
    default: 'mindfulness'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Method to calculate duration when meditation ends
MeditationSchema.methods.endMeditation = function() {
  this.endTime = Date.now();
  const durationMs = this.endTime - this.startTime;
  this.duration = Math.round(durationMs / 60000); // Convert to minutes
  this.completed = true;
  return this.save();
};

// Static method to get meditation stats for a user
MeditationSchema.statics.getUserStats = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await this.aggregate([
    { $match: { 
      userId: mongoose.Types.ObjectId(userId),
      completed: true
    }},
    { $group: {
      _id: null,
      totalSessions: { $sum: 1 },
      totalDuration: { $sum: '$duration' },
      todaySessions: { 
        $sum: {
          $cond: [
            { $gte: ['$startTime', today] },
            1,
            0
          ]
        }
      },
      avgDuration: { $avg: '$duration' }
    }}
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalSessions: 0,
    totalDuration: 0,
    todaySessions: 0,
    avgDuration: 0
  };
};

// Static method to get group stats for multiple users
MeditationSchema.statics.getGroupStats = async function(userIds) {
  const stats = await this.aggregate([
    { $match: { 
      userId: { $in: userIds.map(id => mongoose.Types.ObjectId(id)) },
      completed: true
    }},
    { $group: {
      _id: '$userId',
      totalSessions: { $sum: 1 },
      totalDuration: { $sum: '$duration' },
      lastMeditation: { $max: '$endTime' }
    }}
  ]);
  
  return stats;
};

module.exports = mongoose.model('Meditation', MeditationSchema);