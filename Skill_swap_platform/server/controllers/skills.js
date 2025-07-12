import User from '../models/User.js';

export const searchSkills = async (req, res) => {
  try {
    const { q, category, experienceLevel, page = 1, limit = 20 } = req.query;
    
    const matchStage = {
      isPublic: true,
      isBanned: false,
      'skillsOffered.isApproved': true
    };

    if (category) {
      matchStage['skillsOffered.category'] = category;
    }

    if (experienceLevel) {
      matchStage['skillsOffered.experienceLevel'] = experienceLevel;
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$skillsOffered' },
      { $match: { 'skillsOffered.isApproved': true } }
    ];

    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { 'skillsOffered.name': { $regex: q, $options: 'i' } },
            { 'skillsOffered.description': { $regex: q, $options: 'i' } }
          ]
        }
      });
    }

    if (category) {
      pipeline.push({
        $match: { 'skillsOffered.category': category }
      });
    }

    if (experienceLevel) {
      pipeline.push({
        $match: { 'skillsOffered.experienceLevel': experienceLevel }
      });
    }

    pipeline.push(
      {
        $project: {
          _id: 1,
          name: 1,
          location: 1,
          profilePhoto: 1,
          rating: 1,
          completedSwaps: 1,
          skill: '$skillsOffered',
          lastActive: 1
        }
      },
      { $sort: { lastActive: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    );

    const skills = await User.aggregate(pipeline);

    // Get total count
    const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
    countPipeline.push({ $count: 'total' });
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      skills,
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

export const getSkillCategories = async (req, res) => {
  try {
    const categories = [
      'Technology',
      'Design',
      'Business',
      'Languages',
      'Arts',
      'Sports',
      'Music',
      'Other'
    ];

    // Get skill count for each category
    const categoryCounts = await User.aggregate([
      { $match: { isPublic: true, isBanned: false } },
      { $unwind: '$skillsOffered' },
      { $match: { 'skillsOffered.isApproved': true } },
      {
        $group: {
          _id: '$skillsOffered.category',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryData = categories.map(category => {
      const found = categoryCounts.find(c => c._id === category);
      return {
        name: category,
        count: found ? found.count : 0
      };
    });

    res.status(200).json({
      success: true,
      categories: categoryData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getPopularSkills = async (req, res) => {
  try {
    const popularSkills = await User.aggregate([
      { $match: { isPublic: true, isBanned: false } },
      { $unwind: '$skillsOffered' },
      { $match: { 'skillsOffered.isApproved': true } },
      {
        $group: {
          _id: '$skillsOffered.name',
          count: { $sum: 1 },
          category: { $first: '$skillsOffered.category' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      popularSkills
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};