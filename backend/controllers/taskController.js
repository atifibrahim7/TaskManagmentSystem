const Task = require('../models/Task');
const Team = require('../models/Team');

// Get all tasks for a user (both created and assigned)
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { user: req.user.id },
        { 'assigned_members.user': req.user.id }
      ]
    })
    .populate('user', 'username')
    .populate({
      path: 'team',
      populate: [
        { path: 'creator', select: 'username email' },
        { path: 'members.user', select: 'username email' }
      ]
    })
    .populate('assigned_members.user', 'username')
    .sort({ created_at: -1 });

    return res.json(tasks);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

// Create a new task (only team admin)
const createTask = async (req, res) => {
  try {
    const { title, description, priority, due_date, teamId, assignedMembers } = req.body;

    // Check if user is admin of the team
    const team = await Team.findOne({
      _id: teamId,
      $or: [
        { creator: req.user.id },
        { 'members.user': req.user.id, 'members.role': 'admin' }
      ]
    });

    if (!team) {
      return res.status(403).json({ msg: 'Not authorized to create tasks for this team' });
    }

    // Verify all assigned members are part of the team
    const teamMembers = team.members.map(member => member.user.toString());
    const invalidMembers = assignedMembers.filter(memberId => !teamMembers.includes(memberId));
    
    if (invalidMembers.length > 0) {
      return res.status(400).json({ msg: 'Some assigned members are not part of the team' });
    }

    const task = new Task({
      user: req.user.id,
      team: teamId,
      title,
      description,
      priority,
      due_date,
      assigned_members: assignedMembers.map(memberId => ({
        user: memberId,
        status: 'Not Started'
      }))
    });

    await task.save();
    
    // Populate the task with user and team details
    const populatedTask = await Task.findById(task._id)
      .populate('user', 'username')
      .populate({
        path: 'team',
        populate: [
          { path: 'creator', select: 'username email' },
          { path: 'members.user', select: 'username email' }
        ]
      })
      .populate('assigned_members.user', 'username');

    return res.json(populatedTask);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

// Update task status (for assigned members)
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if user is assigned to the task
    const assignedMember = task.assigned_members.find(
      member => member.user.toString() === req.user.id
    );

    if (!assignedMember) {
      return res.status(403).json({ msg: 'Not authorized to update this task' });
    }

    // Update the member's status
    assignedMember.status = status;
    await task.save();

    // Populate and return the updated task
    const updatedTask = await Task.findById(task._id)
      .populate('user', 'username')
      .populate({
        path: 'team',
        populate: [
          { path: 'creator', select: 'username email' },
          { path: 'members.user', select: 'username email' }
        ]
      })
      .populate('assigned_members.user', 'username');

    return res.json(updatedTask);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

// Update task details (only team admin)
const updateTask = async (req, res) => {
  try {
    const { title, description, priority, due_date, assignedMembers } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if user is admin of the team
    const team = await Team.findOne({
      _id: task.team,
      $or: [
        { creator: req.user.id },
        { 'members.user': req.user.id, 'members.role': 'admin' }
      ]
    });

    if (!team) {
      return res.status(403).json({ msg: 'Not authorized to update this task' });
    }

    // Update task fields
    task.title = title;
    task.description = description;
    task.priority = priority;
    task.due_date = due_date;
    
    // Update assigned members if provided
    if (assignedMembers) {
      // Verify all assigned members are part of the team
      const teamMembers = team.members.map(member => member.user.toString());
      const invalidMembers = assignedMembers.filter(memberId => !teamMembers.includes(memberId));
      
      if (invalidMembers.length > 0) {
        return res.status(400).json({ msg: 'Some assigned members are not part of the team' });
      }

      task.assigned_members = assignedMembers.map(memberId => ({
        user: memberId,
        status: 'Not Started'
      }));
    }

    await task.save();

    // Populate and return the updated task
    const updatedTask = await Task.findById(task._id)
      .populate('user', 'username')
      .populate({
        path: 'team',
        populate: [
          { path: 'creator', select: 'username email' },
          { path: 'members.user', select: 'username email' }
        ]
      })
      .populate('assigned_members.user', 'username');

    return res.json(updatedTask);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

// Delete task (only team admin)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if user is admin of the team
    const team = await Team.findOne({
      _id: task.team,
      $or: [
        { creator: req.user.id },
        { 'members.user': req.user.id, 'members.role': 'admin' }
      ]
    });

    if (!team) {
      return res.status(403).json({ msg: 'Not authorized to delete this task' });
    }

    // Use deleteOne instead of remove which is deprecated
    await Task.deleteOne({ _id: req.params.id });
    
    return res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask
};