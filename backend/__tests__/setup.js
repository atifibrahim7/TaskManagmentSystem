const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// Clear all collections after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Close database connection and stop MongoDB server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Mock the user authentication middleware
jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.user = { id: "60d0fe4f5311236168a109ca" }; // Mock user ID
    next();
  };
});
