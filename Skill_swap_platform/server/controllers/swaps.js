import Swap from '../models/Swap.js';
import User from '../models/User.js';

export const createSwapRequest = async (req, res) => {
  try {
    const {
      providerId,
      skillOffered,
      skillRequested,
      message,
      proposedDate,
      duration,
      format,
      location
    } = req.body;

    // Check if provider exists and is not banned
    const provider = await User.findById(providerId);
    if (!provider || provider.isBanned || !provider.isPublic) {
      return res.status(400).json({
        success: false,
        message: 'Provider not available'
      });
    }

    // Check if user is trying to swap with themselves
    if (providerId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create swap request with yourself'
      });
    }

    // Verify that the provider has the requested skill
    const hasRequestedSkill = provider.skillsOffered.some(
      skill => skill._id.toString() === skillRequested.skillId && skill.isApproved
    );

    if (!hasRequestedSkill) {
      return res.status(400).json({
        success: false,
        message: 'Provider does not have the requested skill'
      });
    }

    // Verify that the requester has the offered skill
    const requester = await User.findById(req.user.id);
    const hasOfferedSkill = requester.skillsOffered.some(
      skill => skill._id.toString() === skillOffered.skillId && skill.isApproved
    );

    if (!hasOfferedSkill) {
      return res.status(400).json({
        success: false,
        message: 'You do not have the offered skill'
      });
    }

    const swap = await Swap.create({
      requester: req.user.id,
      provider: providerId,
      skillOffered,
      skillRequested,
      message,
      proposedDate,
      duration,
      format,
      location
    });

    const populatedSwap = await Swap.findById(swap._id)
      .populate('requester', 'name profilePhoto rating')
      .populate('provider', 'name profilePhoto rating');

    res.status(201).json({
      success: true,
      message: 'Swap request created successfully',
      swap: populatedSwap
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getMySwaps = async (req, res) => {
  try {
    const { status, role = 'all', page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (role === 'requester') {
      query.requester = req.user.id;
    } else if (role === 'provider') {
      query.provider = req.user.id;
    } else {
      query.$or = [
        { requester: req.user.id },
        { provider: req.user.id }
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const swaps = await Swap.find(query)
      .populate('requester', 'name profilePhoto rating')
      .populate('provider', 'name profilePhoto rating')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await Swap.countDocuments(query);

    res.status(200).json({
      success: true,
      swaps,
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

export const getSwapById = async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id)
      .populate('requester', 'name profilePhoto rating location')
      .populate('provider', 'name profilePhoto rating location');

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Check if user is authorized to view this swap
    const isAuthorized = swap.requester._id.toString() === req.user.id || 
                        swap.provider._id.toString() === req.user.id ||
                        req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this swap'
      });
    }

    res.status(200).json({
      success: true,
      swap
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const respondToSwap = async (req, res) => {
  try {
    const { response, rejectionReason } = req.body; // 'accepted' or 'rejected'
    
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Only provider can respond to swap
    if (swap.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the provider can respond to this swap'
      });
    }

    // Can only respond to pending swaps
    if (swap.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only respond to pending swaps'
      });
    }

    swap.status = response;
    swap.responseDate = new Date();
    
    if (response === 'rejected' && rejectionReason) {
      swap.rejectionReason = rejectionReason;
    }

    await swap.save();

    const populatedSwap = await Swap.findById(swap._id)
      .populate('requester', 'name profilePhoto rating')
      .populate('provider', 'name profilePhoto rating');

    res.status(200).json({
      success: true,
      message: `Swap ${response} successfully`,
      swap: populatedSwap
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const cancelSwap = async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Only requester can cancel, and only pending or accepted swaps
    const canCancel = (swap.requester.toString() === req.user.id && 
                      ['pending', 'accepted'].includes(swap.status)) ||
                     req.user.role === 'admin';

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Cannot cancel this swap'
      });
    }

    swap.status = 'cancelled';
    await swap.save();

    res.status(200).json({
      success: true,
      message: 'Swap cancelled successfully',
      swap
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const markSwapCompleted = async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    // Only accepted swaps can be marked as completed
    if (swap.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Only accepted swaps can be marked as completed'
      });
    }

    // Either party can mark as completed
    const canComplete = swap.requester.toString() === req.user.id || 
                       swap.provider.toString() === req.user.id ||
                       req.user.role === 'admin';

    if (!canComplete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this swap'
      });
    }

    swap.status = 'completed';
    swap.completedDate = new Date();
    await swap.save();

    // Update completed swaps count for both users
    await User.findByIdAndUpdate(swap.requester, { $inc: { completedSwaps: 1 } });
    await User.findByIdAndUpdate(swap.provider, { $inc: { completedSwaps: 1 } });

    res.status(200).json({
      success: true,
      message: 'Swap marked as completed successfully',
      swap
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getSwapHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const swaps = await Swap.find({
      $or: [
        { requester: req.user.id },
        { provider: req.user.id }
      ],
      status: 'completed'
    })
    .populate('requester', 'name profilePhoto rating')
    .populate('provider', 'name profilePhoto rating')
    .sort({ completedDate: -1 })
    .limit(limit * 1)
    .skip(skip);

    const total = await Swap.countDocuments({
      $or: [
        { requester: req.user.id },
        { provider: req.user.id }
      ],
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      swaps,
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