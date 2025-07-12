const express = require('express');
const router = express.Router();
const SwapRequest = require('../models/SwapRequest');
const auth = require('../middleware/auth');

// Get all requests for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      $or: [
        { fromUser: req.user.id },
        { toUser: req.user.id }
      ]
    })
    .populate('fromUser', 'name email profilePhoto')
    .populate('toUser', 'name email profilePhoto')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new swap request
router.post('/', auth, async (req, res) => {
  try {
    const { toUser, skillOffered, skillWanted, message } = req.body;

    // Check if request already exists
    const existingRequest = await SwapRequest.findOne({
      fromUser: req.user.id,
      toUser,
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Request already pending' });
    }

    const newRequest = new SwapRequest({
      fromUser: req.user.id,
      toUser,
      skillOffered,
      skillWanted,
      message
    });

    await newRequest.save();
    
    // Populate user data
    await newRequest.populate('fromUser', 'name email profilePhoto');
    await newRequest.populate('toUser', 'name email profilePhoto');

    // Send real-time notification
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const recipientSocketId = connectedUsers.get(toUser);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new-request', newRequest);
    }

    res.json(newRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const request = await SwapRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the recipient can accept/reject
    if (request.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.status = status;
    await request.save();
    
    await request.populate('fromUser', 'name email profilePhoto');
    await request.populate('toUser', 'name email profilePhoto');

    // Send real-time notification
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const senderSocketId = connectedUsers.get(request.fromUser._id.toString());
    
    if (senderSocketId) {
      io.to(senderSocketId).emit('request-updated', request);
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;