const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to validate request body
const validateRequest = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

// Get current user data
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to verify token
router.get("/protected", auth, (req, res) => {
  res.json({ message: 'Token is valid' });
});

// **Register & Send Email Verification**
router.post("/register", validateRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// **Verify User & Add to DB**
router.post("/verify", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token

  if (!token) return res.status(401).json({ error: "Token is required" });

  const { data: user, error } = await supabase.auth.getUser(token);

  if (error || !user)
    return res.status(400).json({ error: "Invalid token or user not found." });

  // Ensure email is verified
  if (!user.user.email_confirmed_at) {
    return res.status(400).json({ error: "Email not verified yet!" });
  }

  // Add verified user to DB
  const { data, error: insertError } = await supabase.from("users").insert([
    {
      id: user.user.id,
      email: user.user.email,
      username: user.user.user_metadata.username,
    },
  ]);

  if (insertError) return res.status(400).json({ error: insertError.message });

  res.json({ message: "User verified & added to database!", user: data });
});

// **Login User**
router.post("/login", validateRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Logged in successfully',
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
