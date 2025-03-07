const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// **Register & Send Email Verification**
router.post("/register", async (req, res) => {
  const { email, password, username } = req.body;

  // Sign up user (Supabase handles sending the email)
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
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Login successful!", token: data.session.access_token });
});

module.exports = router;
