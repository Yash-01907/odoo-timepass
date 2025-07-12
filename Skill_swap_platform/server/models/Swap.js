import mongoose from 'mongoose';

const swapSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillOffered: {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String
  },
  skillRequested: {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  proposedDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true,
    min: [0.5, 'Duration must be at least 30 minutes'],
    max: [8, 'Duration cannot exceed 8 hours']
  },
  format: {
    type: String,
    enum: ['online', 'in-person', 'hybrid'],
    required: true
  },
  location: {
    type: String,
    required: function() {
      return this.format === 'in-person' || this.format === 'hybrid';
    }
  },
  responseDate: Date,
  completedDate: Date,
  rejectionReason: String,
  isRatedByRequester: {
    type: Boolean,
    default: false
  },
  isRatedByProvider: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes
swapSchema.index({ requester: 1, status: 1 });
swapSchema.index({ provider: 1, status: 1 });
swapSchema.index({ status: 1, createdAt: -1 });
swapSchema.index({ proposedDate: 1 });

export default mongoose.model('Swap', swapSchema);