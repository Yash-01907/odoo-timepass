import User from '../models/User.js';

export const getUsers = async (req, res) => {
  try {
    const { search, category, location, page = 1, limit = 10 } = req.query;
    
    const query = { isPublic: true, isBanned: false };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'skillsOffered.name': { $regex: search, $options: 'i' } },
        { 'skillsOffered.description': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query['skillsOffered.category'] = category;
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password -email')
      .limit(limit * 1)
      .skip(skip)
      .sort({ lastActive: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: page,
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

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isPublic && user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'This profile is private'
      });
    }

    res.status(200).json({
      success: true,
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

export const updateUser = async (req, res) => {
  try {
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
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

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this profile'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getUserSkills = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('skillsOffered skillsWanted');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      skills: {
        offered: user.skillsOffered,
        wanted: user.skillsWanted
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

export const addSkill = async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add skills to this profile'
      });
    }

    const { type, skill } = req.body; // type: 'offered' or 'wanted'
    const user = await User.findById(req.params.id);

    if (type === 'offered') {
      user.skillsOffered.push(skill);
    } else if (type === 'wanted') {
      user.skillsWanted.push(skill);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid skill type'
      });
    }

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Skill added successfully',
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

export const updateSkill = async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update skills for this profile'
      });
    }

    const { type, skill } = req.body;
    const user = await User.findById(req.params.id);

    let skillArray = type === 'offered' ? user.skillsOffered : user.skillsWanted;
    const skillIndex = skillArray.findIndex(s => s._id.toString() === req.params.skillId);

    if (skillIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    skillArray[skillIndex] = { ...skillArray[skillIndex].toObject(), ...skill };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Skill updated successfully',
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

export const deleteSkill = async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete skills from this profile'
      });
    }

    const { type } = req.query;
    const user = await User.findById(req.params.id);

    if (type === 'offered') {
      user.skillsOffered.id(req.params.skillId).remove();
    } else if (type === 'wanted') {
      user.skillsWanted.id(req.params.skillId).remove();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid skill type'
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Skill deleted successfully',
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