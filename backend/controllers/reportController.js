const Task = require("../models/Task");
const Team = require("../models/Team");

// Generate a report of completed tasks for a team
const generateTeamReport = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user is admin of the team
    const team = await Team.findOne({
      _id: teamId,
      $or: [
        { creator: req.user.id },
        { "members.user": req.user.id, "members.role": "admin" },
      ],
    });

    if (!team) {
      return res
        .status(403)
        .json({ msg: "Not authorized to generate reports for this team" });
    }

    // Prepare date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.created_at = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.created_at = {
        ...dateFilter.created_at,
        $lte: new Date(endDate),
      };
    }

    // Find all tasks for the team
    const tasks = await Task.find({
      team: teamId,
      ...dateFilter,
    })
      .populate("user", "username")
      .populate("assigned_members.user", "username");

    // Calculate statistics
    const completedTasks = tasks.filter((task) =>
      task.assigned_members.every((member) => member.status === "Completed")
    );

    const inProgressTasks = tasks.filter(
      (task) =>
        task.assigned_members.some(
          (member) => member.status === "In Progress"
        ) &&
        !task.assigned_members.every((member) => member.status === "Completed")
    );

    const notStartedTasks = tasks.filter(
      (task) =>
        task.assigned_members.some(
          (member) => member.status === "Not Started"
        ) &&
        !task.assigned_members.some(
          (member) =>
            member.status === "In Progress" || member.status === "Completed"
        )
    );

    // Calculate completion rates by priority
    const priorityStats = {
      High: { total: 0, completed: 0, rate: 0 },
      Medium: { total: 0, completed: 0, rate: 0 },
      Low: { total: 0, completed: 0, rate: 0 },
    };

    tasks.forEach((task) => {
      priorityStats[task.priority].total++;
      if (
        task.assigned_members.every((member) => member.status === "Completed")
      ) {
        priorityStats[task.priority].completed++;
      }
    });

    // Calculate completion rates
    Object.keys(priorityStats).forEach((priority) => {
      if (priorityStats[priority].total > 0) {
        priorityStats[priority].rate =
          (priorityStats[priority].completed / priorityStats[priority].total) *
          100;
      }
    });

    // Calculate completion by team member
    const memberStats = {};

    tasks.forEach((task) => {
      task.assigned_members.forEach((member) => {
        const username = member.user.username || member.user._id;

        if (!memberStats[username]) {
          memberStats[username] = {
            total: 0,
            completed: 0,
            rate: 0,
          };
        }

        memberStats[username].total++;
        if (member.status === "Completed") {
          memberStats[username].completed++;
        }
      });
    });

    // Calculate completion rates for each member
    Object.keys(memberStats).forEach((member) => {
      if (memberStats[member].total > 0) {
        memberStats[member].rate =
          (memberStats[member].completed / memberStats[member].total) * 100;
      }
    });

    // Compile report data
    const report = {
      teamName: team.name,
      period: {
        startDate: startDate || "All time",
        endDate: endDate || "Present",
      },
      taskSummary: {
        total: tasks.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        notStarted: notStartedTasks.length,
        completionRate:
          tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      },
      priorityBreakdown: priorityStats,
      memberPerformance: memberStats,
      recentCompletedTasks: completedTasks
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map((task) => ({
          id: task._id,
          title: task.title,
          priority: task.priority,
          completedAt: task.assigned_members.every(
            (m) => m.status === "Completed"
          )
            ? Math.max(
                ...task.assigned_members.map((m) =>
                  new Date(m.updatedAt || m.created_at).getTime()
                )
              )
            : null,
        })),
    };

    return res.json(report);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

// Get a list of teams where the user is an admin (for report selection)
const getAdminTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { creator: req.user.id },
        { "members.user": req.user.id, "members.role": "admin" },
      ],
    }).select("name _id");

    return res.json(teams);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

module.exports = {
  generateTeamReport,
  getAdminTeams,
};
