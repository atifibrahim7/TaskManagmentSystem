const mongoose = require("mongoose");
const Task = require("../models/Task");
const Team = require("../models/Team");
const User = require("../models/User");
const {
  createTask,
  getTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require("../controllers/taskController");

describe("Task Controller", () => {
  let mockUser;
  let mockTeam;
  let mockTeamMembers = [];
  let mockRequest;
  let mockResponse;

  // Setup mock data before each test
  beforeEach(async () => {
    // Create mock user
    mockUser = new User({
      _id: "60d0fe4f5311236168a109ca",
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    await mockUser.save();

    // Create additional team members
    const member1 = new User({
      _id: "60d0fe4f5311236168a109cb",
      username: "member1",
      email: "member1@example.com",
      password: "password123",
    });
    await member1.save();

    const member2 = new User({
      _id: "60d0fe4f5311236168a109cc",
      username: "member2",
      email: "member2@example.com",
      password: "password123",
    });
    await member2.save();

    mockTeamMembers = [
      { user: member1._id, role: "member", status: "accepted" },
      { user: member2._id, role: "member", status: "accepted" },
    ];

    // Create mock team with the user as creator/admin
    mockTeam = new Team({
      _id: "60d0fe4f5311236168a109cd",
      name: "Test Team",
      description: "Test team description",
      creator: mockUser._id,
      members: [
        { user: mockUser._id, role: "admin", status: "accepted" },
        ...mockTeamMembers,
      ],
    });
    await mockTeam.save();

    // Setup mock request and response objects
    mockRequest = {
      user: { id: mockUser._id },
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe("getTasks", () => {
    it("should get all tasks for a user", async () => {
      // Create some test tasks for the user
      const task1 = new Task({
        title: "Test Task 1",
        description: "Test description 1",
        user: mockUser._id,
        team: mockTeam._id,
        due_date: new Date(),
        assigned_members: [{ user: mockUser._id, status: "Not Started" }],
      });
      await task1.save();

      const task2 = new Task({
        title: "Test Task 2",
        description: "Test description 2",
        user: mockUser._id,
        team: mockTeam._id,
        due_date: new Date(),
        assigned_members: [{ user: mockUser._id, status: "In Progress" }],
      });
      await task2.save();

      await getTasks(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();

      // Get the tasks parameter passed to json method
      const result = mockResponse.json.mock.calls[0][0];
      expect(result.length).toBe(2);
      expect(result[0].title).toBe("Test Task 2"); // Most recent first
      expect(result[1].title).toBe("Test Task 1");
    });

    it("should handle errors when getting tasks", async () => {
      // Mock Task.find to throw an error
      jest.spyOn(Task, "find").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      await getTasks(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith("Server Error");
    });
  });

  describe("createTask", () => {
    it("should create a task when user is team admin", async () => {
      mockRequest.body = {
        title: "New Task",
        description: "Task description",
        priority: "Medium",
        due_date: new Date(),
        teamId: mockTeam._id.toString(),
        assignedMembers: [mockTeamMembers[0].user.toString()],
      };

      await createTask(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();

      // Verify task was created in the database
      const result = mockResponse.json.mock.calls[0][0];
      expect(result.title).toBe("New Task");
      expect(result.description).toBe("Task description");
      expect(result.priority).toBe("Medium");

      // Verify task exists in database
      const task = await Task.findById(result._id);
      expect(task).not.toBeNull();
      expect(task.title).toBe("New Task");
    });

    it("should return 403 if user is not team admin", async () => {
      // Create a team where user is not admin
      const otherTeam = new Team({
        name: "Other Team",
        description: "Another team",
        creator: new mongoose.Types.ObjectId(),
        members: [{ user: mockUser._id, role: "member", status: "accepted" }],
      });
      await otherTeam.save();

      mockRequest.body = {
        title: "New Task",
        description: "Task description",
        priority: "Medium",
        due_date: new Date(),
        teamId: otherTeam._id.toString(),
        assignedMembers: [mockUser._id.toString()],
      };

      await createTask(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        msg: "Not authorized to create tasks for this team",
      });
    });

    it("should return 400 if assigned members are not part of the team", async () => {
      const nonMemberId = new mongoose.Types.ObjectId();

      mockRequest.body = {
        title: "New Task",
        description: "Task description",
        priority: "Medium",
        due_date: new Date(),
        teamId: mockTeam._id.toString(),
        assignedMembers: [nonMemberId.toString()],
      };

      await createTask(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        msg: "Some assigned members are not part of the team",
      });
    });

    it("should handle errors when creating a task", async () => {
      mockRequest.body = {
        title: "New Task",
        description: "Task description",
        priority: "Medium",
        due_date: new Date(),
        teamId: mockTeam._id.toString(),
        assignedMembers: [mockTeamMembers[0].user.toString()],
      };

      // Mock Team.findOne to throw an error
      jest.spyOn(Team, "findOne").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      await createTask(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith("Server Error");
    });
  });

  describe("updateTask", () => {
    it("should update task details when user is team admin", async () => {
      // Create test task
      const task = new Task({
        title: "Update Test Task",
        description: "Test description",
        user: mockUser._id,
        team: mockTeam._id,
        due_date: new Date(),
        priority: "Low",
        assigned_members: [
          { user: mockTeamMembers[0].user, status: "Not Started" },
        ],
      });
      await task.save();

      mockRequest.params = { id: task._id.toString() };
      mockRequest.body = {
        title: "Updated Task",
        description: "Updated description",
        priority: "High",
        due_date: new Date(),
        assignedMembers: [mockTeamMembers[1].user.toString()],
      };

      await updateTask(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();

      // Verify task was updated
      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.title).toBe("Updated Task");
      expect(updatedTask.description).toBe("Updated description");
      expect(updatedTask.priority).toBe("High");
      expect(updatedTask.assigned_members[0].user.toString()).toBe(
        mockTeamMembers[1].user.toString()
      );
    });

    it("should return 404 if task does not exist", async () => {
      mockRequest.params = { id: new mongoose.Types.ObjectId().toString() };
      mockRequest.body = {
        title: "Updated Task",
        description: "Updated description",
        priority: "High",
        due_date: new Date(),
      };

      await updateTask(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ msg: "Task not found" });
    });

    it("should return 403 if user is not team admin", async () => {
      // Create a team where user is not admin
      const otherTeam = new Team({
        name: "Other Team",
        description: "Another team",
        creator: new mongoose.Types.ObjectId(),
        members: [{ user: mockUser._id, role: "member", status: "accepted" }],
      });
      await otherTeam.save();

      // Create test task in that team
      const task = new Task({
        title: "Update Test Task",
        description: "Test description",
        user: new mongoose.Types.ObjectId(),
        team: otherTeam._id,
        due_date: new Date(),
        priority: "Low",
      });
      await task.save();

      mockRequest.params = { id: task._id.toString() };
      mockRequest.body = {
        title: "Updated Task",
        description: "Updated description",
        priority: "High",
        due_date: new Date(),
      };

      await updateTask(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        msg: "Not authorized to update this task",
      });
    });

    it("should return 400 if assigned members are not part of the team", async () => {
      // Create test task
      const task = new Task({
        title: "Update Test Task",
        description: "Test description",
        user: mockUser._id,
        team: mockTeam._id,
        due_date: new Date(),
        priority: "Low",
        assigned_members: [
          { user: mockTeamMembers[0].user, status: "Not Started" },
        ],
      });
      await task.save();

      mockRequest.params = { id: task._id.toString() };
      mockRequest.body = {
        title: "Updated Task",
        description: "Updated description",
        priority: "High",
        due_date: new Date(),
        assignedMembers: [new mongoose.Types.ObjectId().toString()], // Non-member ID
      };

      await updateTask(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        msg: "Some assigned members are not part of the team",
      });
    });

    it("should handle errors when updating a task", async () => {
      mockRequest.params = { id: new mongoose.Types.ObjectId().toString() };
      mockRequest.body = {
        title: "Updated Task",
        description: "Updated description",
        priority: "High",
        due_date: new Date(),
      };

      // Mock Task.findById to throw an error
      jest.spyOn(Task, "findById").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      await updateTask(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith("Server Error");
    });
  });

  //   describe("deleteTask", () => {
  //     it("should delete task when user is team admin", async () => {
  //       // Create test task
  //       const task = new Task({
  //         title: "Delete Test Task",
  //         description: "Test description",
  //         user: mockUser._id,
  //         team: mockTeam._id,
  //         due_date: new Date(),
  //       });
  //       await task.save();

  //       mockRequest.params = { id: task._id.toString() };

  //       await deleteTask(mockRequest, mockResponse);

  //       expect(mockResponse.json).toHaveBeenCalledWith({ msg: "Task removed" });

  //       // Verify task was deleted
  //       const deletedTask = await Task.findById(task._id);
  //       expect(deletedTask).toBeNull();
  //     });

  //     it("should return 404 if task does not exist", async () => {
  //       mockRequest.params = { id: new mongoose.Types.ObjectId().toString() };

  //       await deleteTask(mockRequest, mockResponse);

  //       expect(mockResponse.status).toHaveBeenCalledWith(404);
  //       expect(mockResponse.json).toHaveBeenCalledWith({ msg: "Task not found" });
  //     });

  //     it("should return 403 if user is not team admin", async () => {
  //       // Create a team where user is not admin
  //       const otherTeam = new Team({
  //         name: "Other Team",
  //         description: "Another team",
  //         creator: new mongoose.Types.ObjectId(),
  //         members: [{ user: mockUser._id, role: "member", status: "accepted" }],
  //       });
  //       await otherTeam.save();

  //       // Create test task in that team
  //       const task = new Task({
  //         title: "Delete Test Task",
  //         description: "Test description",
  //         user: new mongoose.Types.ObjectId(),
  //         team: otherTeam._id,
  //         due_date: new Date(),
  //       });
  //       await task.save();

  //       mockRequest.params = { id: task._id.toString() };

  //       await deleteTask(mockRequest, mockResponse);

  //       expect(mockResponse.status).toHaveBeenCalledWith(403);
  //       expect(mockResponse.json).toHaveBeenCalledWith({
  //         msg: "Not authorized to delete this task",
  //       });
  //     });

  //     it("should handle errors when deleting a task", async () => {
  //       mockRequest.params = { id: new mongoose.Types.ObjectId().toString() };

  //       // Mock Task.findById to throw an error
  //       jest.spyOn(Task, "findById").mockImplementationOnce(() => {
  //         throw new Error("Database error");
  //       });

  //       await deleteTask(mockRequest, mockResponse);

  //       expect(mockResponse.status).toHaveBeenCalledWith(500);
  //       expect(mockResponse.send).toHaveBeenCalledWith("Server Error");
  //     });
  //   });
});
