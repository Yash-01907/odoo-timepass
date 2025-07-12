import mongoose from 'mongoose';

const adminMessageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: true,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['announcement', 'maintenance', 'feature_update', 'warning'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create indexes
adminMessageSchema.index({ isActive: 1, scheduledFor: 1 });
adminMessageSchema.index({ type: 1, priority: 1 });

export default mongoose.model('AdminMessage', adminMessageSchema);