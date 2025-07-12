import Rating from '../models/Rating.js';
import Swap from '../models/Swap.js';
import User from '../models/User.js';

export const createRating = async (req, res) => {
  try {
    const { swapId, rateeId, rating, feedback, categories } = req.body;

    // Check if swap exists and is completed
    const swap = await Swap.findById(swapId);
    if (!swap || swap.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed swaps'
      });
    }

    // Check if user was part of the swap
    const isPartOfSwap = swap.requester.toString() === req.user.id || 
                        swap.provider.toString() === req.user.id;
    if (!isPartOfSwap) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate swaps you participated in'
      });
    }

    // Check if user is trying to rate the correct person
    const correctRatee = (swap.requester.toString() === req.user.id && swap.provider.toString() === rateeId) ||
                        (swap.provider.toString() === req.user.id && swap.requester.toString() === rateeId);
    if (!correctRatee) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ratee for this swap'
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({ swap: swapId, rater: req.user.id });
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this swap'
      });
    }

    const newRating = await Rating.create({
      swap: swapId,
      rater: req.user.id,
      ratee: rateeId,
      rating,
      feedback,
      categories
    });

    // Update user's average rating
    await updateUserRating(rateeId);

    // Mark swap as rated by the rater
    const isRequester = swap.requester.toString() === req.user.id;
    if (isRequester) {
      swap.isRatedByRequester = true;
    } else {
      swap.isRatedByProvider = true;
    }
    await swap.save();

    const populatedRating = await Rating.findById(newRating._id)
      .populate('rater', 'name profilePhoto')
      .populate('ratee', 'name profilePhoto')
      .populate('swap', 'skillOffered skillRequested');

    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      rating: populatedRating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getUserRatings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const ratings = await Rating.find({ ratee: req.params.userId })
      .populate('rater', 'name profilePhoto')
      .populate('swap', 'skillOffered skillRequested completedDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await Rating.countDocuments({ ratee: req.params.userId });

    // Calculate rating statistics
    const stats = await Rating.aggregate([
      { $match: { ratee: mongoose.Types.ObjectId(req.params.userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          avgCommunication: { $avg: '$categories.communication' },
          avgPunctuality: { $avg: '$categories.punctuality' },
          avgSkillQuality: { $avg: '$categories.skillQuality' },
          avgProfessionalism: { $avg: '$categories.professionalism' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      ratings,
      stats: stats[0] || {
        averageRating: 0,
        totalRatings: 0,
        avgCommunication: 0,
        avgPunctuality: 0,
        avgSkillQuality: 0,
        avgProfessionalism: 0
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getSwapRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ swap: req.params.swapId })
      .populate('rater', 'name profilePhoto')
      .populate('ratee', 'name profilePhoto');

    res.status(200).json({
      success: true,
      ratings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const updateRating = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Only the rater can update their rating
    if (rating.rater.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own ratings'
      });
    }

    const updatedRating = await Rating.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('rater', 'name profilePhoto')
     .populate('ratee', 'name profilePhoto');

    // Update user's average rating
    await updateUserRating(rating.ratee);

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      rating: updatedRating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const deleteRating = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Only the rater or admin can delete rating
    if (rating.rater.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this rating'
      });
    }

    const rateeId = rating.ratee;
    await Rating.findByIdAndDelete(req.params.id);

    // Update user's average rating
    await updateUserRating(rateeId);

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to update user's average rating
const updateUserRating = async (userId) => {
  try {
    const stats = await Rating.aggregate([
      { $match: { ratee: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    const rating = stats[0] ? {
      average: Math.round(stats[0].averageRating * 10) / 10,
      count: stats[0].count
    } : { average: 0, count: 0 };

    await User.findByIdAndUpdate(userId, { rating });
  } catch (error) {
    console.error('Error updating user rating:', error);
  }
};