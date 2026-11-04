
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate a signed authentication token.
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

// Return public account information without the password.
const formatUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar || ""
});

// POST /api/auth/register
// Create a new FightLab account.
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Username, email, and password are required."
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 30 ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Username must be 3-30 characters and password at least 8 characters."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Enter a valid email address."
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanEmail }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email is already registered."
      });
    }

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username or email is already registered."
      });
    }

    return res.status(500).json({
      message: "Unable to create account."
    });
  }
};

// POST /api/auth/login
// Authenticate an existing account.
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const passwordMatches =
      await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in."
    });
  }
};

// GET /api/auth/me
// Return the currently authenticated account.
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    return res.status(200).json({
      user: formatUser(user)
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve profile."
    });
  }
};
