import User from '../models/User.js';
import Swap from '../models/Swap.js';
import Rating from '../models/Rating.js';
import AdminMessage from '../models/AdminMessage.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    
    const totalSwaps = await Swap.countDocuments();
    const pendingSwaps = await Swap.countDocuments({ status: 'pending' });
    const completedSwaps = await Swap.countDocuments({ status: 'completed' });
    
    const totalRatings = await Rating.countDocuments();
    const averageRating = await Rating.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    // Recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentSwaps = await Swap.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('requester', 'name')
      .populate('provider', 'name');

    // Skills awaiting approval
    const skillsAwaitingApproval = await User.aggregate([
      { $unwind: '$skillsOffered' },
      { $match: { 'skillsOffered.isApproved': false } },
      {
        $project: {
          userId: '$_id',
          userName: '$name',
          skill: '$skillsOffered'
        }
      },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers
        },
        swaps: {
          total: totalSwaps,
          pending: pendingSwaps,
          completed: completedSwaps
        },
        ratings: {
          total: totalRatings,
          average: averageRating[0]?.avg || 0
        }
      },
      recentActivity: {
        users: recentUsers,
        swaps: recentSwaps
      },
      skillsAwaitingApproval
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'active') {
      query.isBanned = false;
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
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

export const banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isBanned: true,
        banReason: reason
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isBanned: false,
        $unset: { banReason: 1 }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User unbanned successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const approveSkill = async (req, res) => {
  try {
    const { userId, skillId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const skill = user.skillsOffered.id(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    skill.isApproved = true;
    skill.rejectionReason = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Skill approved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const rejectSkill = async (req, res) => {
  try {
    const { userId, skillId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const skill = user.skillsOffered.id(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    skill.isApproved = false;
    skill.rejectionReason = reason;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Skill rejected successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getAllSwaps = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const swaps = await Swap.find(query)
      .populate('requester', 'name email')
      .populate('provider', 'name email')
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

export const sendPlatformMessage = async (req, res) => {
  try {
    const { title, content, type, priority, expiresAt } = req.body;

    const message = await AdminMessage.create({
      title,
      content,
      type,
      priority,
      expiresAt,
      sentBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Platform message sent successfully',
      adminMessage: message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getPlatformMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await AdminMessage.find({
      isActive: true,
      scheduledFor: { $lte: new Date() },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } }
      ]
    })
    .populate('sentBy', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip(skip);

    const total = await AdminMessage.countDocuments({
      isActive: true,
      scheduledFor: { $lte: new Date() }
    });

    res.status(200).json({
      success: true,
      messages,
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

export const generateUserActivityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const userStats = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                { $gte: ['$lastActive', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const topSkillCategories = await User.aggregate([
      { $unwind: '$skillsOffered' },
      { $match: { 'skillsOffered.isApproved': true } },
      {
        $group: {
          _id: '$skillsOffered.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      report: {
        userRegistrationTrends: userStats,
        topSkillCategories,
        generatedAt: new Date()
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

export const generateSwapReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const swapStats = await Swap.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            status: '$status',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const averageResponseTime = await Swap.aggregate([
      { 
        $match: { 
          ...dateFilter,
          responseDate: { $exists: true }
        }
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$responseDate', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      report: {
        swapStatusTrends: swapStats,
        averageResponseTimeHours: averageResponseTime[0]?.avgResponseTime || 0,
        generatedAt: new Date()
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

export const generateFeedbackReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const ratingStats = await Rating.aggregate([
      { $match: dateFilter },
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

    const ratingDistribution = await Rating.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      report: {
        overallStats: ratingStats[0] || {
          averageRating: 0,
          totalRatings: 0,
          avgCommunication: 0,
          avgPunctuality: 0,
          avgSkillQuality: 0,
          avgProfessionalism: 0
        },
        ratingDistribution,
        generatedAt: new Date()
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