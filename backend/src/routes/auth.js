  const express = require("express");
  const router = express.Router();
  const { createClient } = require("@supabase/supabase-js");
  require("dotenv").config();
  const authenticateUser = require("../middleware/authMiddleware");
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  /**
   * /register endpoint
   * - Registers the user and sends a verification email.
   */
  router.post("/register", async (req, res) => {
    const { email, password, username } = req.body;

    // Sign up user with Supabase (Supabase will send the verification email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) return res.status(400).json({ error: error.message });

    res
      .status(201)
      .json({ message: "Verification email sent! Check your inbox." });
  });

  router.post("/verify", authenticateUser, async (req, res) => {
    const { id, email, user_metadata } = req.user; // Get user info from middleware

    // Insert user into database if not exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (existingUser) return res.json({ message: "User already verified." });

    const { data, error } = await supabase
      .from("users")
      .insert([{ id, email, username: user_metadata.username }]);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "User verified & added to database!", user: data });
  });
  /**
   * /login endpoint
   * - Authenticates the user and returns a token.
   * - Does NOT modify the DB.
   */
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Login successful!", token: data.session.access_token });
  });

  router.get("/protected", authenticateUser, (req, res) => {
    res.json({ message: "Welcome to the protected route!", user: req.user });
  });
  module.exports = router;
