const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Team = require("../models/Team");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Helper function to extract mentions from comment text
const extractMentions = (text) => {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]); // Extract username without the @ symbol
  }

  return mentions;
};

// Get all comments for a task
const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get the task to check team membership
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    // Check if user is part of the team
    const team = await Team.findById(task.team);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    const isMember =
      team.members.some(
        (member) =>
          member.user.toString() === req.user.id && member.status === "accepted"
      ) || team.creator.toString() === req.user.id;

    if (!isMember) {
      return res.status(403).json({ msg: "Not authorized to view comments" });
    }

    // Get comments for the task
    const comments = await Comment.find({ task: taskId })
      .populate("user", "username email")
      .sort({ created_at: -1 });

    // Add role information to each comment
    const commentsWithRoles = await Promise.all(
      comments.map(async (comment) => {
        let role = "member";

        // Check if user is the team creator
        if (team.creator.toString() === comment.user._id.toString()) {
          role = "creator";
        } else {
          // Check if user is an admin
          const memberInfo = team.members.find(
            (m) => m.user.toString() === comment.user._id.toString()
          );
          if (memberInfo && memberInfo.role === "admin") {
            role = "admin";
          }
        }

        const commentObj = comment.toObject();
        commentObj.userRole = role;
        return commentObj;
      })
    );

    return res.json(commentsWithRoles);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

// Add a comment to a task
const createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { taskId } = req.params;

    if (!text) {
      return res.status(400).json({ msg: "Comment text is required" });
    }

    // Get the task to check team membership
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    // Check if user is part of the team
    const team = await Team.findById(task.team);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    const isMember =
      team.members.some(
        (member) =>
          member.user.toString() === req.user.id && member.status === "accepted"
      ) || team.creator.toString() === req.user.id;

    if (!isMember) {
      return res
        .status(403)
        .json({ msg: "Not authorized to comment on this task" });
    }

    // Extract mentions from comment text
    const mentionedUsernames = extractMentions(text);

    // Find mentioned users who are part of the team
    const mentionedUsers = [];

    if (mentionedUsernames.length > 0) {
      // Get all team members (including creator)
      const teamMemberIds = team.members
        .filter((member) => member.status === "accepted")
        .map((member) => member.user.toString());

      if (team.creator) {
        teamMemberIds.push(team.creator.toString());
      }

      // Find users by username who are part of the team
      const users = await User.find({
        username: { $in: mentionedUsernames },
      });

      // Filter users to only include team members
      users.forEach((user) => {
        if (
          teamMemberIds.includes(user._id.toString()) &&
          user._id.toString() !== req.user.id
        ) {
          mentionedUsers.push(user._id);
        }
      });
    }

    // Create the comment
    const comment = new Comment({
      text,
      user: req.user.id,
      task: taskId,
      mentions: mentionedUsers,
    });

    await comment.save();

    // Create notifications for mentioned users
    const currentUser = await User.findById(req.user.id);
    const notifications = mentionedUsers.map((userId) => ({
      recipient: userId,
      sender: req.user.id,
      task: taskId,
      comment: comment._id,
      text: `${
        currentUser.username
      } mentioned you in a comment: "${text.substring(0, 50)}${
        text.length > 50 ? "..." : ""
      }"`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Populate user details before returning
    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "username email")
      .populate("mentions", "username email");

    // Add user role
    let role = "member";

    // Check if user is the team creator
    if (team.creator.toString() === req.user.id) {
      role = "creator";
    } else {
      // Check if user is an admin
      const memberInfo = team.members.find(
        (m) => m.user.toString() === req.user.id
      );
      if (memberInfo && memberInfo.role === "admin") {
        role = "admin";
      }
    }

    const commentObj = populatedComment.toObject();
    commentObj.userRole = role;

    return res.status(201).json(commentObj);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

// Get notifications for the authenticated user
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "username")
      .populate("task", "title")
      .sort({ created_at: -1 });

    return res.json(notifications);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

// Mark notifications as read
const markNotificationsAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !notificationIds.length) {
      return res.status(400).json({ msg: "Notification IDs are required" });
    }

    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: req.user.id,
      },
      { $set: { read: true } }
    );

    return res.json({ msg: "Notifications marked as read" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

module.exports = {
  getComments,
  createComment,
  getUserNotifications,
  markNotificationsAsRead,
};
