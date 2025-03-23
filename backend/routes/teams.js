const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Create a new team
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const team = new Team({
      name,
      creator: req.user.userId,
      members: [{ user: req.user.userId, role: 'admin', status: 'accepted' }]
    });
    await team.save();
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: 'Error creating team', error: error.message });
  }
});

// Get all teams for a user (both created and member of)
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { creator: req.user.userId },
        { 'members.user': req.user.userId }
      ]
    }).populate('creator', 'username email')
      .populate('members.user', 'username email');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teams', error: error.message });
  }
});

// Invite user to team
router.post('/:teamId/invite', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const team = await Team.findOne({ _id: req.params.teamId, creator: req.user.userId });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found or unauthorized' });
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = team.members.find(member => 
      member.user.toString() === invitedUser._id.toString()
    );
    
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    team.members.push({
      user: invitedUser._id,
      role: 'member',
      status: 'pending'
    });

    await team.save();

    // Populate the team with member details before sending response
    const populatedTeam = await Team.findById(team._id)
      .populate('creator', 'username email')
      .populate('members.user', 'username email');

    res.json(populatedTeam);
  } catch (error) {
    res.status(500).json({ message: 'Error inviting user', error: error.message });
  }
});

// Accept/Reject team invitation
router.patch('/:teamId/respond', auth, async (req, res) => {
  try {
    const { status } = req.body; // status can be 'accepted' or 'rejected'
    const team = await Team.findOne({
      _id: req.params.teamId,
      'members.user': req.user.userId,
      'members.status': 'pending'
    });

    if (!team) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    const memberIndex = team.members.findIndex(
      member => member.user.toString() === req.user.userId
    );

    team.members[memberIndex].status = status;
    await team.save();

    // Populate the team with member details before sending response
    const populatedTeam = await Team.findById(team._id)
      .populate('creator', 'username email')
      .populate('members.user', 'username email');

    res.json(populatedTeam);
  } catch (error) {
    res.status(500).json({ message: 'Error responding to invitation', error: error.message });
  }
});

// Get team invitations for current user
router.get('/invitations', auth, async (req, res) => {
  try {
    const teams = await Team.find({
      'members': {
        $elemMatch: {
          user: req.user.userId,
          status: 'pending'
        }
      }
    }).populate('creator', 'username email')
      .populate('members.user', 'username email');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invitations', error: error.message });
  }
});

// Search users
router.get('/search-users', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search users by username or email, excluding the current user
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.userId } }, // Exclude current user
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('username email');

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member to team
router.post('/:teamId/members', auth, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId, role } = req.body;

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has permission to add members
    if (team.creator.toString() !== req.user.userId && 
        !team.members.some(m => m.user.toString() === req.user.userId && m.role === 'admin')) {
      return res.status(403).json({ message: 'Not authorized to add members' });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    if (team.members.some(m => m.user.toString() === userId)) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    // Add member to team
    team.members.push({
      user: userId,
      role,
      status: 'accepted' // Direct adds are automatically accepted
    });

    await team.save();

    // Populate the team with member details
    const updatedTeam = await Team.findById(teamId)
      .populate('creator', 'username email')
      .populate('members.user', 'username email');

    res.json(updatedTeam);
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 