import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Teams = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [teamForm, setTeamForm] = useState({
    name: '',
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
  });

  useEffect(() => {
    fetchTeams();
    fetchInvitations();
  }, [token]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/teams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      setError('Failed to fetch teams');
      console.error(err);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/teams/invitations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setInvitations(data);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(teamForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create team');
      }

      setTeams([...teams, data]);
      setShowCreateTeam(false);
      setTeamForm({ name: '' });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/teams/${selectedTeam._id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to invite user');
      }

      // Update the teams list with the new member
      const updatedTeams = teams.map(team =>
        team._id === selectedTeam._id ? data : team
      );
      setTeams(updatedTeams);
      setShowInviteUser(false);
      setInviteForm({ email: '' });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInvitationResponse = async (teamId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to respond to invitation');
      }

      // Remove the invitation from the list
      setInvitations(invitations.filter(inv => inv._id !== teamId));
      // Refresh teams list if accepted
      if (status === 'accepted') {
        fetchTeams();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getMemberStatus = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2 py-1 text-xs bg-green-600/20 text-green-400 border border-green-500 rounded">Active</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-500 rounded">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-600/20 text-red-400 border border-red-500 rounded">Rejected</span>;
      default:
        return null;
    }
  };

  const isTeamAdmin = (team) => {
    if (!team) return false;
    return team.creator._id.toString() === user?._id.toString() || team.members.some(m => m.user._id.toString() === user?._id.toString() && m.role === 'admin');
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/teams/search-users?query=${searchTerm}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to search users');
      }
      setSearchResults(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMember = async (userId, role = 'member') => {
    try {
      const response = await fetch(`http://localhost:5000/api/teams/${selectedTeam._id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add member');
      }

      // Update the teams list with the new member
      const updatedTeams = teams.map(team =>
        team._id === selectedTeam._id ? data : team
      );
      setTeams(updatedTeams);
      setSearchResults([]);
      setSearchTerm('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <nav className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Teams</h1>
            <div className="flex gap-4">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Teams</h2>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Team
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Team Form */}
        {showCreateTeam && (
          <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Pending Invitations</h3>
            {invitations.map((invitation) => (
              <div
                key={invitation._id}
                className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-medium">{invitation.name}</p>
                  <p className="text-gray-400 text-sm">
                    Created by: {invitation.creator.username}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleInvitationResponse(invitation._id, 'accepted')}
                    className="px-3 py-1 bg-green-600/20 text-green-400 border border-green-500 rounded hover:bg-green-600/30 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleInvitationResponse(invitation._id, 'rejected')}
                    className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500 rounded hover:bg-red-600/30 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Teams List */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Your Teams</h3>
          {teams.map((team) => (
            <div
              key={team._id}
              className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-white">{team.name}</h4>
                  <p className="text-gray-400 mt-1">
                    Members: {team.members.filter(m => m.status === 'accepted').length}
                  </p>
                  <button
                    onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}
                    className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    {expandedTeam === team._id ? 'Hide Members' : 'Show Members'}
                  </button>
                </div>
                {isTeamAdmin(team) && (
                  <button
                    onClick={() => {
                      setSelectedTeam(team);
                      setShowInviteUser(true);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600/20 text-blue-400 border border-blue-500 rounded hover:bg-blue-600/30 transition-colors"
                  >
                    Invite User
                  </button>
                )}
              </div>

              {/* Members List */}
              {expandedTeam === team._id && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="text-sm font-medium text-gray-300">Team Members</h5>
                    {isTeamAdmin(team) && (
                      <button
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowAddMember(true);
                        }}
                        className="px-3 py-1 text-sm bg-green-600/20 text-green-400 border border-green-500 rounded hover:bg-green-600/30 transition-colors"
                      >
                        Add Member
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-700">
                    {team.members.map((member) => (
                      <div key={member.user._id} className="py-2 flex justify-between items-center">
                        <div>
                          <p className="text-white">{member.user.username || member.user.email}</p>
                          <p className="text-sm text-gray-400">
                            Role: {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getMemberStatus(member.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Invite User Modal */}
        {showInviteUser && selectedTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">
                Invite User to {selectedTeam.name}
              </h3>
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    User Email
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Send Invitation
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteUser(false);
                      setSelectedTeam(null);
                      setInviteForm({ email: '' });
                    }}
                    className="px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMember && selectedTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">
                Add Member to {selectedTeam.name}
              </h3>
              <form onSubmit={handleSearchUsers} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Search Users
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter username or email"
                      className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Search Results</h4>
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          className="flex justify-between items-center p-2 bg-gray-700/30 rounded-lg"
                        >
                          <span className="text-white">{user.username || user.email}</span>
                          <button
                            type="button"
                            onClick={() => handleAddMember(user._id)}
                            className="px-3 py-1 text-sm bg-green-600/20 text-green-400 border border-green-500 rounded hover:bg-green-600/30 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMember(false);
                      setSelectedTeam(null);
                      setSearchTerm('');
                      setSearchResults([]);
                    }}
                    className="px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams; 