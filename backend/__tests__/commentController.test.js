const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const { getComments, createComment } = require('../controllers/commentController');

describe('Comment Controller', () => {
  let mockUser;
  let mockTeamCreator;
  let mockTeamAdmin;
  let mockTeamMember;
  let mockNonMember;
  let mockTeam;
  let mockTask;
  let mockRequest;
  let mockResponse;
  
  // Setup mock data before each test
  beforeEach(async () => {
    // Create mock users with string IDs for consistent comparison
    mockUser = new User({
      _id: '60d0fe4f5311236168a109ca',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await mockUser.save();
    
    mockTeamCreator = new User({
      _id: '60d0fe4f5311236168a109cb',
      username: 'teamcreator',
      email: 'creator@example.com',
      password: 'password123'
    });
    await mockTeamCreator.save();
    
    mockTeamAdmin = new User({
      _id: '60d0fe4f5311236168a109cc',
      username: 'teamadmin',
      email: 'admin@example.com',
      password: 'password123'
    });
    await mockTeamAdmin.save();
    
    mockTeamMember = new User({
      _id: '60d0fe4f5311236168a109cd',
      username: 'teammember',
      email: 'member@example.com',
      password: 'password123'
    });
    await mockTeamMember.save();
    
    mockNonMember = new User({
      _id: '60d0fe4f5311236168a109ce',
      username: 'nonmember',
      email: 'nonmember@example.com',
      password: 'password123'
    });
    await mockNonMember.save();
    
    // Create mock team with all the necessary members
    mockTeam = new Team({
      _id: '60d0fe4f5311236168a109cf',
      name: 'Test Team',
      description: 'Test team description',
      creator: mockTeamCreator._id,
      members: [
        { user: mockTeamCreator._id, role: 'admin', status: 'accepted' },
        { user: mockTeamAdmin._id, role: 'admin', status: 'accepted' },
        { user: mockTeamMember._id, role: 'member', status: 'accepted' },
        { user: mockUser._id, role: 'member', status: 'accepted' }
      ]
    });
    await mockTeam.save();
    
    // Create mock task
    mockTask = new Task({
      _id: '60d0fe4f5311236168a109d0',
      title: 'Test Task',
      description: 'Test description',
      user: mockTeamCreator._id,
      team: mockTeam._id,
      due_date: new Date(),
      priority: 'Medium',
      assigned_members: [
        { user: mockTeamMember._id, status: 'Not Started' },
        { user: mockUser._id, status: 'In Progress' }
      ]
    });
    await mockTask.save();
    
    // Setup mock request and response objects
    mockRequest = {
      user: { id: mockUser._id.toString() }, // Make sure to use toString()
      params: { taskId: mockTask._id.toString() },
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });
  
  describe('getComments', () => {
    it('should get all comments for a task with correct roles', async () => {
      // Create some test comments
      const comment1 = new Comment({
        text: 'Comment from team creator',
        user: mockTeamCreator._id,
        task: mockTask._id,
        created_at: new Date(Date.now() - 1000) // 1 second ago
      });
      await comment1.save();
      
      const comment2 = new Comment({
        text: 'Comment from team admin',
        user: mockTeamAdmin._id,
        task: mockTask._id,
        created_at: new Date(Date.now() - 2000) // 2 seconds ago
      });
      await comment2.save();
      
      const comment3 = new Comment({
        text: 'Comment from regular member',
        user: mockTeamMember._id,
        task: mockTask._id,
        created_at: new Date(Date.now() - 3000) // 3 seconds ago
      });
      await comment3.save();
      
      await getComments(mockRequest, mockResponse);
      
      // Assertions
      expect(mockResponse.status).not.toHaveBeenCalled(); // Success doesn't call status
      
      const result = mockResponse.json.mock.calls[0][0];
      expect(result).toBeDefined();
      expect(result.length).toBe(3);
      
      // Check order (newest first)
      expect(result[0].text).toBe('Comment from team creator');
      expect(result[0].userRole).toBe('creator');
      
      expect(result[1].text).toBe('Comment from team admin');
      expect(result[1].userRole).toBe('admin');
      
      expect(result[2].text).toBe('Comment from regular member');
      expect(result[2].userRole).toBe('member');
    });
    
    it('should return 404 if task does not exist', async () => {
      mockRequest.params.taskId = new mongoose.Types.ObjectId().toString();
      
      await getComments(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Task not found' });
    });
    
    it('should return 404 if team does not exist', async () => {
      // Create a task with non-existent team
      const taskWithBadTeam = new Task({
        title: 'Bad Team Task',
        description: 'Task with bad team reference',
        user: mockUser._id,
        team: new mongoose.Types.ObjectId(),
        due_date: new Date()
      });
      await taskWithBadTeam.save();
      
      mockRequest.params.taskId = taskWithBadTeam._id.toString();
      
      await getComments(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Team not found' });
    });
    
    it('should return 403 if user is not a team member', async () => {
      mockRequest.user = { id: mockNonMember._id.toString() };
      
      await getComments(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Not authorized to view comments' });
    });
    
    it('should handle errors when getting comments', async () => {
      // Mock Task.findById to return a valid task
      jest.spyOn(Task, 'findById').mockImplementationOnce(() => ({
        _id: mockTask._id,
        team: mockTeam._id
      }));
      
      // Mock Team.findById to simulate successful team lookup
      jest.spyOn(Team, 'findById').mockImplementationOnce(() => ({
        _id: mockTeam._id,
        creator: mockTeamCreator._id.toString(),
        members: [{ 
          user: mockUser._id.toString(), 
          role: 'member',
          status: 'accepted' 
        }],
        toObject: () => ({
          _id: mockTeam._id,
          creator: mockTeamCreator._id.toString(),
          members: [{ 
            user: mockUser._id.toString(), 
            role: 'member',
            status: 'accepted' 
          }]
        })
      }));
      
      // Mock Comment.find to throw an error
      jest.spyOn(Comment, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      await getComments(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Server Error');
    });
  });
  
  describe('createComment', () => {
    it('should create a comment when user is a team member', async () => {
      mockRequest.body = { text: 'This is a test comment' };
      
      await createComment(mockRequest, mockResponse);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      
      const result = mockResponse.json.mock.calls[0][0];
      expect(result).toBeDefined();
      expect(result.text).toBe('This is a test comment');
      expect(result.user._id.toString()).toBe(mockUser._id.toString());
      expect(result.task.toString()).toBe(mockTask._id.toString());
      expect(result.userRole).toBe('member');
      
      // Verify the comment was actually saved to the database
      const savedComment = await Comment.findById(result._id);
      expect(savedComment).not.toBeNull();
      expect(savedComment.text).toBe('This is a test comment');
    });
    
    it('should create a comment with creator role', async () => {
      mockRequest.user = { id: mockTeamCreator._id.toString() };
      mockRequest.body = { text: 'Comment from team creator' };
      
      await createComment(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      
      const result = mockResponse.json.mock.calls[0][0];
      expect(result).toBeDefined();
      expect(result.userRole).toBe('creator');
    });
    
    it('should create a comment with admin role', async () => {
      mockRequest.user = { id: mockTeamAdmin._id.toString() };
      mockRequest.body = { text: 'Comment from team admin' };
      
      await createComment(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      
      const result = mockResponse.json.mock.calls[0][0];
      expect(result).toBeDefined();
      expect(result.userRole).toBe('admin');
    });
    
    it('should return 400 if text is missing', async () => {
      mockRequest.body = { text: '' };
      
      await createComment(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Comment text is required' });
    });
    
    it('should return 404 if task does not exist', async () => {
      mockRequest.params.taskId = new mongoose.Types.ObjectId().toString();
      mockRequest.body = { text: 'Comment for non-existent task' };
      
      await createComment(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Task not found' });
    });
    
    it('should return 404 if team does not exist', async () => {
      // Create a task with non-existent team
      const taskWithBadTeam = new Task({
        title: 'Bad Team Task',
        description: 'Task with bad team reference',
        user: mockUser._id,
        team: new mongoose.Types.ObjectId(),
        due_date: new Date()
      });
      await taskWithBadTeam.save();
      
      mockRequest.params.taskId = taskWithBadTeam._id.toString();
      mockRequest.body = { text: 'Comment for task with bad team' };
      
      await createComment(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Team not found' });
    });
    
    it('should return 403 if user is not a team member', async () => {
      mockRequest.user = { id: mockNonMember._id.toString() };
      mockRequest.body = { text: 'Comment from non-member' };
      
      await createComment(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Not authorized to comment on this task' });
    });
    
    it('should handle errors when creating a comment', async () => {
      mockRequest.body = { text: 'This should fail' };
      
      // Mock the necessary functions to pass the permission checks
      jest.spyOn(Task, 'findById').mockImplementationOnce(() => ({
        _id: mockTask._id,
        team: mockTeam._id
      }));
      
      jest.spyOn(Team, 'findById').mockImplementationOnce(() => ({
        _id: mockTeam._id,
        creator: mockTeamCreator._id.toString(),
        members: [{ 
          user: mockUser._id.toString(), 
          role: 'member',
          status: 'accepted' 
        }]
      }));
      
      // Mock Comment constructor to throw an error when saving
      jest.spyOn(Comment.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      await createComment(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Server Error');
    });
  });
});