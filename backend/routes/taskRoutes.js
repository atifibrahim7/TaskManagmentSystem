const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to verify auth token
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Authentication token required" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error) throw error;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid authentication token" });
  }
};

// Create a new task
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, deadline, priority } = req.body;
    console.log(req.body);
    // Validate required fields
    if (!title || !description || !deadline || !priority) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Insert task into Supabase
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          description,
          deadline,
          priority,
          user_id: req.user.id,
          status: "Pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
});

// Update a task
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if task exists and belongs to user
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select()
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (fetchError || !existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found or unauthorized",
      });
    }

    // Update task
    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: updates.title || existingTask.title,
        description: updates.description || existingTask.description,
        deadline: updates.deadline || existingTask.deadline,
        priority: updates.priority || existingTask.priority,
        status: updates.status || existingTask.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
});

// Delete a task
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if task exists and belongs to user
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select()
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (fetchError || !existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found or unauthorized",
      });
    }

    // Delete task
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
});

module.exports = router;
