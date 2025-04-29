const express = require("express");
const router = express.Router();
const {
  getComments,
  createComment,
  getUserNotifications,
  markNotificationsAsRead,
} = require("../controllers/commentController");
const auth = require("../middleware/auth");

// Get all comments for a task
router.get("/task/:taskId", auth, getComments);

// Add a comment to a task
router.post("/task/:taskId", auth, createComment);

// Get user notifications
router.get("/notifications", auth, getUserNotifications);

// Mark notifications as read
router.put("/notifications/read", auth, markNotificationsAsRead);

module.exports = router;
