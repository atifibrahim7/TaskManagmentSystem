const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

// Get all tasks for a user
router.get("/", auth, getTasks);

// Create a new task (only team admin)
router.post("/", auth, createTask);

// Update task status (for assigned members)
router.patch("/:id/status", auth, updateTaskStatus);

// Update task details (only team admin)
router.put("/:id", auth, updateTask);

// Delete task (only team admin)
router.delete("/:id", auth, deleteTask);

module.exports = router;
