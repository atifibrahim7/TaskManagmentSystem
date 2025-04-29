const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Team = require('../models/Team');

// Get all comments for a task
const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Get the task to check team membership
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if user is part of the team
    const team = await Team.findById(task.team);
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }
    
    const isMember = team.members.some(member => 
      member.user.toString() === req.user.id && member.status === 'accepted'
    ) || team.creator.toString() === req.user.id;
    
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to view comments' });
    }
    
    // Get comments for the task
    const comments = await Comment.find({ task: taskId })
      .populate('user', 'username email')
      .sort({ created_at: -1 });
    
    // Add role information to each comment
    const commentsWithRoles = await Promise.all(comments.map(async (comment) => {
      let role = 'member';
      
      // Check if user is the team creator
      if (team.creator.toString() === comment.user._id.toString()) {
        role = 'creator';
      } else {
        // Check if user is an admin
        const memberInfo = team.members.find(m => 
          m.user.toString() === comment.user._id.toString()
        );
        if (memberInfo && memberInfo.role === 'admin') {
          role = 'admin';
        }
      }
      
      const commentObj = comment.toObject();
      commentObj.userRole = role;
      return commentObj;
    }));
    
    return res.json(commentsWithRoles);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

// Add a comment to a task
const createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { taskId } = req.params;
    
    if (!text) {
      return res.status(400).json({ msg: 'Comment text is required' });
    }
    
    // Get the task to check team membership
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if user is part of the team
    const team = await Team.findById(task.team);
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }
    
    const isMember = team.members.some(member => 
      member.user.toString() === req.user.id && member.status === 'accepted'
    ) || team.creator.toString() === req.user.id;
    
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to comment on this task' });
    }
    
    // Create the comment
    const comment = new Comment({
      text,
      user: req.user.id,
      task: taskId
    });
    
    await comment.save();
    
    // Populate user details before returning
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username email');
    
    // Add user role
    let role = 'member';
    
    // Check if user is the team creator
    if (team.creator.toString() === req.user.id) {
      role = 'creator';
    } else {
      // Check if user is an admin
      const memberInfo = team.members.find(m => 
        m.user.toString() === req.user.id
      );
      if (memberInfo && memberInfo.role === 'admin') {
        role = 'admin';
      }
    }
    
    const commentObj = populatedComment.toObject();
    commentObj.userRole = role;
    
    return res.status(201).json(commentObj);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

module.exports = {
  getComments,
  createComment
};