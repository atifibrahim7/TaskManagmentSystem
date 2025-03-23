import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProtectedData } from "../services/api";
import { Button } from "./UI/Button";
import { Card } from "./UI/Card";
import { Input } from "./UI/Input";

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "Low",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError("Failed to fetch tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!taskForm.title || !taskForm.description || !taskForm.deadline || !taskForm.priority) {
        throw new Error('Please fill in all required fields');
      }

      const url = editingTask
        ? `http://localhost:5000/api/tasks/${editingTask._id}`
        : "http://localhost:5000/api/tasks";

      const method = editingTask ? "PUT" : "POST";
      
      // Match the database schema exactly
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        due_date: new Date(taskForm.deadline).toISOString(),
        completed: editingTask ? editingTask.completed : false // Preserve completed status when editing
      };

      console.log('Submitting task with data:', taskData);
      console.log('Request URL:', url);
      console.log('Request method:', method);

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Failed to save task');
      }

      // Clear any existing error
      setError("");
      
      // Refresh the task list
      await fetchTasks();
      
      // Reset form and state
      setShowAddTask(false);
      setEditingTask(null);
      setTaskForm({
        title: "",
        description: "",
        deadline: "",
        priority: "Low",
      });

      // Show success message (optional)
      console.log(`Task ${editingTask ? 'updated' : 'created'} successfully`);
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err.message || 'Failed to save task. Please try again.');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to delete task');
      }

      // Clear any existing error
      setError("");
      
      // Refresh the task list
      await fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task. Please try again.');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      deadline: task.due_date.split("T")[0],
      priority: task.priority,
    });
    // Clear any existing error when starting to edit
    setError("");
    setShowAddTask(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <nav className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">TaskMaster</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {showAddTask ? "Cancel" : "Add Task"}
              </button>
              <button
                onClick={() => navigate('/teams')}
                className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Teams
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {showAddTask && (
          <div className="mb-8 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>
            <form onSubmit={handleTaskSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, deadline: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingTask ? "Update Task" : "Create Task"}
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {task.title}
                  </h3>
                  <p className="text-gray-400 mt-1">{task.description}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        task.priority === "High"
                          ? "bg-red-500/20 text-red-400 border border-red-500"
                          : task.priority === "Medium"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                          : "bg-green-500/20 text-green-400 border border-green-500"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-sm text-gray-400">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(task)}
                    className="px-3 py-1 text-sm bg-blue-600/20 text-blue-400 border border-blue-500 rounded hover:bg-blue-600/30 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="px-3 py-1 text-sm bg-red-600/20 text-red-400 border border-red-500 rounded hover:bg-red-600/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
