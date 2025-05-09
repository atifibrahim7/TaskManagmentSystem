import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProtectedData } from "../services/api";
import { Button } from "./UI/Button";
import { Card } from "./UI/Card";
import { Input } from "./UI/Input";

const Dashboard = () => {
  // ...existing state variables
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditTask, setShowEditTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [taskComments, setTaskComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [addingComment, setAddingComment] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // new state for active tab: 'active' or 'completed'

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "Low",
    teamId: "",
    assignedMembers: [],
  });

  const [editTaskForm, setEditTaskForm] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "Low",
    teamId: "",
    assignedMembers: [],
  });

  const navigate = useNavigate();

  // Helper function to check if a task is completed (all assigned members have completed it)
  const isTaskCompleted = (task) => {
    if (!task.assigned_members || task.assigned_members.length === 0) {
      return false;
    }
    return task.assigned_members.every(
      (member) => member.status === "Completed"
    );
  };

  // Filter tasks based on completion status
  const getFilteredTasks = () => {
    if (activeTab === "active") {
      return tasks.filter((task) => !isTaskCompleted(task));
    } else {
      return tasks.filter((task) => isTaskCompleted(task));
    }
  };

  // New state variables for mentions and notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearchText, setMentionSearchText] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [currentTaskForMention, setCurrentTaskForMention] = useState(null);
  const commentInputRefs = useRef({});

  useEffect(() => {
    fetchTasks();
    fetchTeams();
    fetchNotifications(); // Added notification fetching
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

  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/teams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };

  // Fetch notifications for the current user
  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/comments/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const notificationsData = await response.json();
      setNotifications(notificationsData);

      // Calculate unread count
      const unread = notificationsData.filter(
        (notification) => !notification.read
      ).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Mark notifications as read
  const markNotificationsAsRead = async (notificationIds) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/comments/notifications/read",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notificationIds }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      // Update local state to mark notifications as read
      setNotifications((prev) =>
        prev.map((notification) =>
          notificationIds.includes(notification._id)
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update unread count
      setUnreadCount((prev) => prev - notificationIds.length);
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Find the task related to this notification
    const task = tasks.find((t) => t._id === notification.task._id);

    if (task) {
      // Show comments for this task
      setShowComments((prev) => ({ ...prev, [task._id]: true }));

      // Fetch comments if not already loaded
      if (!taskComments[task._id]) {
        fetchComments(task._id);
      }

      // Mark the notification as read
      if (!notification.read) {
        markNotificationsAsRead([notification._id]);
      }

      // Close notifications panel
      setShowNotifications(false);

      // Scroll to the task (add id to task element)
      setTimeout(() => {
        const taskElement = document.getElementById(`task-${task._id}`);
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
          taskElement.classList.add("highlight-task");
          setTimeout(() => {
            taskElement.classList.remove("highlight-task");
          }, 2000);
        }
      }, 100);
    }
  };

  const handleTeamSelect = async (teamId) => {
    const team = teams.find((t) => t._id === teamId);
    if (team) {
      setSelectedTeam(team);
      setTeamMembers(team.members.filter((m) => m.status === "accepted"));
      setTaskForm((prev) => ({ ...prev, teamId, assignedMembers: [] }));
    }
  };

  const handleMemberSelect = (memberId) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      if (
        !taskForm.title ||
        !taskForm.description ||
        !taskForm.deadline ||
        !taskForm.teamId ||
        selectedMembers.length === 0
      ) {
        throw new Error(
          "Please fill in all required fields and select at least one team member"
        );
      }

      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        due_date: taskForm.deadline,
        priority: taskForm.priority,
        teamId: taskForm.teamId,
        assignedMembers: selectedMembers,
      };

      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }

      setError("");
      await fetchTasks();
      setShowAddTask(false);
      setSelectedTeam(null);
      setTeamMembers([]);
      setSelectedMembers([]);
      setTaskForm({
        title: "",
        description: "",
        deadline: "",
        priority: "Low",
        teamId: "",
        assignedMembers: [],
      });
    } catch (err) {
      setError(err.message || "Failed to create task");
    }
  };

  const handleStatusUpdate = async (taskId, status) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      const updatedTask = await response.json();

      // Update the task in the tasks array
      setTasks(
        tasks.map((task) => {
          if (task._id === updatedTask._id) {
            return {
              ...task,
              assigned_members: task.assigned_members.map((member) => {
                if (member.user._id === user._id) {
                  return { ...member, status };
                }
                return member;
              }),
            };
          }
          return task;
        })
      );

      // If we're currently editing this task, update the edit form
      if (editingTask && editingTask._id === taskId) {
        setEditingTask((prev) => ({
          ...prev,
          assigned_members: prev.assigned_members.map((member) => {
            if (member.user._id === user._id) {
              return { ...member, status };
            }
            return member;
          }),
        }));
      }
    } catch (err) {
      setError("Failed to update task status");
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Not Started":
        return "bg-gray-500/20 text-gray-400 border-gray-500";
      case "In Progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
      case "Completed":
        return "bg-green-500/20 text-green-400 border-green-500";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500";
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    setDeletingTaskId(taskId);
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

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonErr) {
        responseData = {};
      }
      console.log("Delete response:", response, responseData);

      if (!response.ok) {
        throw new Error(
          responseData.msg || responseData.message || "Failed to delete task"
        );
      }

      // Optimistically remove the task from the UI
      setTasks((tasks) => tasks.filter((task) => task._id !== taskId));
      setError("");
    } catch (err) {
      console.error("Error deleting task:", err);
      setError(err.message || "Failed to delete task. Please try again.");
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    // Set team members for the current team
    const team = teams.find((t) => t._id === task.team._id);
    if (team) {
      setSelectedTeam(team);
      const acceptedMembers = team.members.filter(
        (m) => m.status === "accepted"
      );
      setTeamMembers(
        acceptedMembers.map((m) => ({
          _id: m.user._id,
          username: m.user.username || m.user.email,
        }))
      );
      // Only keep assigned members that are in the current team
      const validAssigned = task.assigned_members
        .map((member) => member.user._id)
        .filter((id) => acceptedMembers.some((m) => m.user._id === id));
      setSelectedMembers(validAssigned);
    } else {
      setSelectedTeam(null);
      setTeamMembers([]);
      setSelectedMembers([]);
    }
    setEditTaskForm({
      title: task.title,
      description: task.description,
      deadline: task.due_date
        ? new Date(task.due_date).toISOString().split("T")[0]
        : "",
      priority: task.priority,
      teamId: task.team._id,
      assignedMembers: task.assigned_members.map((member) => member.user._id),
    });
    setShowEditTask(true);
  };

  const handleEditTeamSelect = (teamId) => {
    const team = teams.find((t) => t._id === teamId);
    if (team) {
      setEditTaskForm((prev) => ({ ...prev, teamId }));
      setSelectedTeam(team);
      const acceptedMembers = team.members.filter(
        (m) => m.status === "accepted"
      );
      setTeamMembers(
        acceptedMembers.map((m) => ({
          _id: m.user._id,
          username: m.user.username || m.user.email,
        }))
      );
      setSelectedMembers([]); // Reset assigned members when team changes
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...editTaskForm,
        due_date: editTaskForm.deadline
          ? new Date(editTaskForm.deadline).toISOString()
          : null,
        assignedMembers: selectedMembers,
      };

      const response = await fetch(
        `http://localhost:5000/api/tasks/${editingTask._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update task");
      }

      const updatedTask = await response.json();
      setTasks(
        tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
      setShowEditTask(false);
      setEditingTask(null);
      setEditTaskForm({
        title: "",
        description: "",
        deadline: "",
        priority: "Low",
        teamId: "",
        assignedMembers: [],
      });
    } catch (err) {
      setError(err.message || "Failed to update task");
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isTaskAdmin = (task) => {
    // Check if user is the creator of the task
    if (task.user._id === user._id) {
      return true;
    }

    // Check if user is an admin of the team
    if (task.team && task.team.members) {
      return task.team.members.some(
        (member) => member.user._id === user._id && member.role === "admin"
      );
    }

    return false;
  };

  // Only team admin (creator or admin role) can delete
  const isTeamAdmin = (task) => {
    // If no team data, we can't determine admin status
    if (!task.team) return false;

    // Handle case where team might be directly populated with just name
    if (typeof task.team === "string" || (task.team && !task.team.members)) {
      // Need to check teams state for admin info
      const team = teams.find(
        (t) =>
          t._id === (typeof task.team === "string" ? task.team : task.team._id)
      );
      if (!team) return false;

      return (
        team.creator === user._id ||
        team.members.some((m) => m.user._id === user._id && m.role === "admin")
      );
    }

    // Normal case - team is fully populated
    return (
      (task.team.creator && task.team.creator._id === user._id) ||
      (task.team.members &&
        task.team.members.some(
          (member) =>
            member.user &&
            member.user._id === user._id &&
            member.role === "admin"
        ))
    );
  };

  // Fetch comments for a task
  const fetchComments = async (taskId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/comments/task/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const comments = await response.json();
      setTaskComments((prev) => ({
        ...prev,
        [taskId]: comments,
      }));
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  // Toggle comments section visibility
  const toggleComments = (taskId) => {
    setShowComments((prev) => {
      const isCurrentlyShown = prev[taskId];

      // If we're showing comments, fetch them
      if (!isCurrentlyShown) {
        fetchComments(taskId);
      }

      return {
        ...prev,
        [taskId]: !isCurrentlyShown,
      };
    });

    // Initialize comment text field if needed
    if (!commentText[taskId]) {
      setCommentText((prev) => ({
        ...prev,
        [taskId]: "",
      }));
    }
  };

  // Handle comment text input
  const handleCommentChange = (taskId, text) => {
    setCommentText((prev) => ({
      ...prev,
      [taskId]: text,
    }));
  };

  // Add a comment to a task
  const addComment = async (taskId) => {
    if (!commentText[taskId]?.trim()) return;

    setAddingComment(taskId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/comments/task/${taskId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: commentText[taskId],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const newComment = await response.json();

      // Add new comment to state
      setTaskComments((prev) => ({
        ...prev,
        [taskId]: [newComment, ...(prev[taskId] || [])],
      }));

      // Clear comment text
      setCommentText((prev) => ({
        ...prev,
        [taskId]: "",
      }));
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment");
    } finally {
      setAddingComment(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get role badge styles
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "creator":
        return "bg-purple-500/30 text-purple-300 border-purple-500";
      case "admin":
        return "bg-blue-500/30 text-blue-300 border-blue-500";
      default:
        return "bg-green-500/30 text-green-300 border-green-500";
    }
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case "creator":
        return "Creator";
      case "admin":
        return "Admin";
      default:
        return "Member";
    }
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
            <div className="flex gap-4 items-center">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    // Mark all as read when closing
                    if (showNotifications && unreadCount > 0) {
                      const unreadIds = notifications
                        .filter((n) => !n.read)
                        .map((n) => n._id);
                      if (unreadIds.length) {
                        markNotificationsAsRead(unreadIds);
                      }
                    }
                  }}
                  className="text-white p-2 rounded-full hover:bg-gray-700 relative"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 shadow-lg rounded-lg z-50">
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="text-white font-medium">Notifications</h3>
                      {notifications.some((n) => !n.read) && (
                        <button
                          onClick={() => {
                            const unreadIds = notifications
                              .filter((n) => !n.read)
                              .map((n) => n._id);
                            markNotificationsAsRead(unreadIds);
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className={`p-3 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer flex ${
                              !notification.read ? "bg-gray-700/20" : ""
                            }`}
                          >
                            <div className="w-2 self-stretch mr-2 flex-shrink-0">
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-white">
                                {notification.text}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400">
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                data-testid="create-task-button"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {showAddTask ? "Cancel" : "Add Task"}
              </button>
              <button
                onClick={() => navigate("/teams")}
                className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Teams
              </button>
              <button
                onClick={() => navigate("/reports")}
                className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reports
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
              Create New Task
            </h2>
            <form onSubmit={handleTaskSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team
                </label>
                <select
                  data-testid="task-team"
                  value={taskForm.teamId}
                  onChange={(e) => handleTeamSelect(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTeam && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign to Team Members
                  </label>
                  <div className="space-y-2">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member, index) => (
                        <div
                          key={member.user._id}
                          className="flex items-center"
                        >
                          <input
                            type="checkbox"
                            data-testid={`task-member-${index + 1}`}
                            id={`member-${member.user._id}`}
                            checked={selectedMembers.includes(member.user._id)}
                            onChange={() => handleMemberSelect(member.user._id)}
                            className="mr-2"
                          />
                          <label
                            htmlFor={`member-${member.user._id}`}
                            className="text-white"
                          >
                            {member.user.username || member.user.email}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">No team members available</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  data-testid="task-title"
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
                  data-testid="task-description"
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
                    data-testid="task-deadline"
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
                    data-testid="task-priority"
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
                data-testid="task-submit"
                type="submit"
                className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Task
              </button>
            </form>
          </div>
        )}

        {showEditTask && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowEditTask(false);
              setEditingTask(null);
            }}
          >
            <div
              className="relative bg-gray-800/90 p-4 sm:p-6 rounded-xl border border-gray-700 w-full max-w-md sm:max-w-lg md:max-w-xl overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl font-bold focus:outline-none"
                onClick={() => {
                  setShowEditTask(false);
                  setEditingTask(null);
                }}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-4 text-white">Edit Task</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTaskForm.title}
                    onChange={(e) =>
                      setEditTaskForm({
                        ...editTaskForm,
                        title: e.target.value,
                      })
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
                    value={editTaskForm.description}
                    onChange={(e) =>
                      setEditTaskForm({
                        ...editTaskForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={editTaskForm.deadline}
                    onChange={(e) =>
                      setEditTaskForm({
                        ...editTaskForm,
                        deadline: e.target.value,
                      })
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
                    value={editTaskForm.priority}
                    onChange={(e) =>
                      setEditTaskForm({
                        ...editTaskForm,
                        priority: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team
                  </label>
                  <select
                    value={editTaskForm.teamId}
                    onChange={(e) => handleEditTeamSelect(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    required
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign Members
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-700/50">
                    {teamMembers.map((member) => (
                      <div key={member._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`member-${member._id}`}
                          checked={selectedMembers.includes(member._id)}
                          onChange={() => handleMemberSelect(member._id)}
                          className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-700"
                        />
                        <label
                          htmlFor={`member-${member._id}`}
                          className="text-white"
                        >
                          {member.username}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Update Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task tabs navigation */}
        <div className="mb-6">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "active"
                  ? "border-b-2 border-indigo-500 text-indigo-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Active Tasks
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "completed"
                  ? "border-b-2 border-green-500 text-green-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Completed Tasks
            </button>
          </div>
        </div>

        {/* Conditional messages for empty task lists */}
        {getFilteredTasks().length === 0 && (
          <div className="text-center py-12">
            {activeTab === "active" ? (
              <div className="text-gray-400">
                <p className="text-lg">You don't have any active tasks.</p>
                <p className="mt-2">Create a new task to get started!</p>
              </div>
            ) : (
              <div className="text-gray-400">
                <p className="text-lg">No completed tasks yet.</p>
                <p className="mt-2">
                  Tasks will appear here when all assigned members complete
                  them.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4">
          {getFilteredTasks().map((task) => (
            <div
              key={task._id}
              className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700"
              id={`task-${task._id}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {task.title}
                  </h3>
                  <p className="text-gray-400 mt-1">{task.description}</p>
                  <div className="mt-4 flex items-center gap-4">
                    {/* Removed overall task status badge */}
                    {/* <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span> */}
                    <span className="text-sm text-gray-400">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                    {task.team && (
                      <span className="text-sm text-gray-400">
                        Team: {task.team.name}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        task.priority === "High"
                          ? "bg-red-500/20 text-red-400 border border-red-500"
                          : task.priority === "Medium"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">Assigned to:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {task.assigned_members?.map((member) => (
                        <div
                          key={member.user._id}
                          className="flex items-center gap-2"
                        >
                          <span className="text-sm text-gray-300">
                            {member.user.username || member.user.email}
                          </span>
                          {member.user._id === user._id && (
                            <select
                              value={member.status}
                              onChange={(e) =>
                                handleStatusUpdate(task._id, e.target.value)
                              }
                              className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          )}
                          {member.user._id !== user._id && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                                member.status
                              )}`}
                            >
                              {member.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isTaskAdmin(task) && (
                    <>
                      <button
                        onClick={() => handleEdit(task)}
                        className="px-3 py-1 text-sm bg-blue-600/20 text-blue-400 border border-blue-500 rounded hover:bg-blue-600/30 transition-colors"
                      >
                        Edit
                      </button>
                      {isTeamAdmin(task) && (
                        <button
                          onClick={() => handleDelete(task._id)}
                          className={`px-3 py-1 text-sm bg-red-600/20 text-red-400 border border-red-500 rounded hover:bg-red-600/30 transition-colors ${
                            deletingTaskId === task._id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={deletingTaskId === task._id}
                        >
                          {deletingTaskId === task._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => toggleComments(task._id)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  {showComments[task._id] ? "Hide Comments" : "Show Comments"}
                </button>

                {showComments[task._id] && (
                  <div className="mt-3">
                    {/* Add a comment */}
                    <div className="flex gap-2 relative">
                      <input
                        type="text"
                        value={commentText[task._id] || ""}
                        onChange={(e) =>
                          handleCommentChange(task._id, e.target.value)
                        }
                        placeholder="Add a comment... (use @ to mention team members)"
                        className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white text-sm"
                        ref={(el) => (commentInputRefs.current[task._id] = el)}
                        onInput={(e) => handleCommentInput(task._id, e)}
                      />
                      <button
                        onClick={() => addComment(task._id)}
                        disabled={
                          addingComment === task._id ||
                          !commentText[task._id]?.trim()
                        }
                        className={`px-3 py-2 bg-indigo-600/70 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm ${
                          addingComment === task._id ||
                          !commentText[task._id]?.trim()
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {addingComment === task._id ? "Posting..." : "Post"}
                      </button>

                      {/* Mention suggestions dropdown */}
                      {showMentionSuggestions &&
                        currentTaskForMention?._id === task._id && (
                          <div className="absolute left-0 top-10 mt-2 w-64 max-h-48 overflow-y-auto bg-gray-800 border border-gray-700 shadow-lg rounded-lg z-10">
                            <div className="p-2 border-b border-gray-700">
                              <p className="text-sm text-gray-400">
                                Mention a team member
                              </p>
                            </div>
                            <div>
                              {mentionSuggestions.length > 0 ? (
                                mentionSuggestions.map((member) => (
                                  <button
                                    key={member.id}
                                    onClick={() =>
                                      insertMention(member.username)
                                    }
                                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white text-sm"
                                  >
                                    @{member.username}
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-center text-gray-400 text-sm">
                                  No matching team members
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Comments list */}
                    <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
                      {taskComments[task._id]?.length > 0 ? (
                        taskComments[task._id].map((comment) => (
                          <div
                            key={comment._id}
                            className="p-3 bg-gray-700/30 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-indigo-400 text-sm">
                                  {comment.user.username || comment.user.email}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
                                    comment.userRole
                                  )}`}
                                >
                                  {getRoleDisplayName(comment.userRole)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="mt-1 text-white text-sm">
                              {comment.text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No comments yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
