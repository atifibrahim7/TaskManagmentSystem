const express = require("express");
const router = express.Router();
const {
  generateTeamReport,
  getAdminTeams,
} = require("../controllers/reportController");
const auth = require("../middleware/auth");

// @route   GET /api/reports/teams
// @desc    Get teams where user is admin (for report selection)
// @access  Private
router.get("/teams", auth, getAdminTeams);

// @route   GET /api/reports/team/:teamId
// @desc    Generate a report for a team
// @access  Private (admin only, verified in controller)
router.get("/team/:teamId", auth, generateTeamReport);

module.exports = router;
