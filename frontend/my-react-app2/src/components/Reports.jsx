import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Reports = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminTeams, setAdminTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchAdminTeams();
  }, [token]);

  const fetchAdminTeams = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/reports/teams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }

      const teams = await response.json();
      setAdminTeams(teams);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin teams:", err);
      setError(err.message || "Failed to fetch teams");
      setLoading(false);
    }
  };

  const generateReport = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;

    setGeneratingReport(true);
    setError("");
    try {
      // Build query parameters for date filtering
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `http://localhost:5000/api/reports/team/${selectedTeam}${
          params.toString() ? `?${params.toString()}` : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to generate report");
      }

      const reportData = await response.json();
      setReport(reportData);
    } catch (err) {
      console.error("Error generating report:", err);
      setError(err.message || "Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  // Helper function to get color for completion rate
  const getCompletionRateColor = (rate) => {
    if (rate >= 80) return "text-green-500";
    if (rate >= 50) return "text-yellow-500";
    return "text-red-500";
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
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/teams")}
                className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Teams
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Task Reports</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
            <form onSubmit={generateReport} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    required
                  >
                    <option value="">Select a team</option>
                    {adminTeams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  disabled={generatingReport || !selectedTeam}
                >
                  {generatingReport ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Report Results */}
        {report && (
          <div className="mt-8 space-y-6">
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                {report.teamName} - Task Summary
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Period: {report.period.startDate} to {report.period.endDate}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-700/30 rounded-lg text-center">
                  <p className="text-gray-400 text-sm">Total Tasks</p>
                  <p className="text-white text-2xl font-bold">
                    {report.taskSummary.total}
                  </p>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <p className="text-green-400 text-sm">Completed</p>
                  <p className="text-white text-2xl font-bold">
                    {report.taskSummary.completed}
                  </p>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                  <p className="text-yellow-400 text-sm">In Progress</p>
                  <p className="text-white text-2xl font-bold">
                    {report.taskSummary.inProgress}
                  </p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                  <p className="text-red-400 text-sm">Not Started</p>
                  <p className="text-white text-2xl font-bold">
                    {report.taskSummary.notStarted}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-medium text-white mb-2">
                  Overall Completion Rate
                </h4>
                <div className="w-full bg-gray-700/50 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        report.taskSummary.completionRate
                      )}%`,
                    }}
                  ></div>
                </div>
                <p
                  className={`text-right mt-1 ${getCompletionRateColor(
                    report.taskSummary.completionRate
                  )}`}
                >
                  {report.taskSummary.completionRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                Completion by Priority
              </h3>
              <div className="space-y-4">
                {Object.entries(report.priorityBreakdown).map(
                  ([priority, stats]) => (
                    <div key={priority} className="mb-4">
                      <div className="flex justify-between mb-1">
                        <p className="text-gray-300">
                          {priority} Priority
                          <span className="text-gray-400 text-sm ml-2">
                            ({stats.completed} of {stats.total} completed)
                          </span>
                        </p>
                        <p className={`${getCompletionRateColor(stats.rate)}`}>
                          {stats.rate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            priority === "High"
                              ? "bg-red-500"
                              : priority === "Medium"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(100, stats.rate)}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Member Performance */}
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                Team Member Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-gray-400 text-sm">
                    <tr>
                      <th className="px-4 py-2">Member</th>
                      <th className="px-4 py-2">Assigned Tasks</th>
                      <th className="px-4 py-2">Completed</th>
                      <th className="px-4 py-2">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.memberPerformance).map(
                      ([member, stats]) => (
                        <tr key={member} className="border-t border-gray-700">
                          <td className="px-4 py-3 text-white">{member}</td>
                          <td className="px-4 py-3 text-gray-300">
                            {stats.total}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {stats.completed}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-700/50 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    stats.rate >= 80
                                      ? "bg-green-500"
                                      : stats.rate >= 50
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(100, stats.rate)}%`,
                                  }}
                                ></div>
                              </div>
                              <span
                                className={getCompletionRateColor(stats.rate)}
                              >
                                {stats.rate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Completed Tasks */}
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                Recently Completed Tasks
              </h3>
              {report.recentCompletedTasks.length > 0 ? (
                <ul className="space-y-2">
                  {report.recentCompletedTasks.map((task) => (
                    <li
                      key={task.id}
                      className="p-3 bg-gray-700/30 rounded-lg flex justify-between items-center"
                    >
                      <span className="text-white">{task.title}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.priority === "High"
                            ? "bg-red-500/20 text-red-400 border border-red-500"
                            : task.priority === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">
                  No completed tasks in this period.
                </p>
              )}
            </div>

            {/* Export Options */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  // Create a blob with the JSON data
                  const jsonData = JSON.stringify(report, null, 2);
                  const blob = new Blob([jsonData], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);

                  // Create an anchor element and trigger download
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${report.teamName}_report_${
                    new Date().toISOString().split("T")[0]
                  }.json`;
                  document.body.appendChild(a);
                  a.click();

                  // Clean up
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export Report
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
