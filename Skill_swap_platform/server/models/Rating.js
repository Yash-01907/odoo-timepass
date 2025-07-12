import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  swap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Swap',
    required: true
  },
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  categories: {
    communication: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    skillQuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  }
}, {
  timestamps: true
});

// Create indexes
ratingSchema.index({ ratee: 1, rating: 1 });
ratingSchema.index({ swap: 1, rater: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema);