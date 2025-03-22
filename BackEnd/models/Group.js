// models/Group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a group name'],
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Limiting to 4 members as per requirements
  maxMembers: {
    type: Number,
    default: 4
  },
  // For group challenges and goals
  weeklyGoal: {
    type: Number,
    default: 0 // Minutes per week for the group
  },
  joinCode: {
    type: String,
    unique: true
  }
}, { timestamps: true });

// Pre-save hook to generate join code if not provided
GroupSchema.pre('save', function(next) {
  if (!this.joinCode) {
    // Generate a random 6-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.joinCode = code;
  }
  next();
});

// Method to check if group is full
GroupSchema.methods.isFull = function() {
  return this.members.length >= this.maxMembers;
};

// Method to add a member if group is not full
GroupSchema.methods.addMember = async function(userId) {
  if (this.isFull()) {
    throw new Error('Group is already full');
  }
  
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    await this.save();
  }
  
  return this;
};

// Static method to get group's meditation stats
GroupSchema.statics.getGroupProgress = async function(groupId) {
  const group = await this.findById(groupId).populate('members', 'username');
  
  if (!group) {
    throw new Error('Group not found');
  }
  
  const Meditation = mongoose.model('Meditation');
  const memberStats = await Meditation.getGroupStats(group.members);
  
  // Map stats to include usernames
  const result = memberStats.map(stat => {
    const member = group.members.find(m => m._id.toString() === stat._id.toString());
    return {
      userId: stat._id,
      username: member ? member.username : 'Unknown',
      totalSessions: stat.totalSessions,
      totalDuration: stat.totalDuration,
      lastMeditation: stat.lastMeditation
    };
  });
  
  return result;
};

module.exports = mongoose.model('Group', GroupSchema);