const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const Joi = require('joi');
const mongoose = require("mongoose"); // Ensure mongoose is imported

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// Function to generate a random unique ID
function generateRandomTeacherId() {
    return new mongoose.Types.ObjectId().toHexString(); // Generates a unique ID
}

router.post("/register", async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        // Check if email already exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a random teacherId for teachers
        const teacherId = role === "teacher" ? generateRandomTeacherId() : "";

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role,
            teacherId, // Assign teacherId only if the role is 'teacher'
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      SECRET,
      { expiresIn: '1h' }
    );

    res.json({ username: user.username, role: user.role, balance: user.balance || 0, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user info (protected route)
router.get('/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Get user balance (only for logged-in pupils)
router.get('/balance', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });
    // if (user.role !== 'pupil') return res.status(403).json({ message: 'Access denied' });

    res.json({ balance: user.balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/topup', authenticate, async (req, res) => {
  const { email, amount } = req.body;
  const userRole = req.user.role;

  if (userRole !== 'teacher' && userRole !== 'parent') {
      return res.status(403).json({ message: 'Unauthorised: Only teachers and parents can top-up credits.' });
  }

  const pupil = await User.findOne({ email, role: 'pupil' });
  if (!pupil) {
      return res.status(404).json({ message: 'Pupil not found.' });
  }

  pupil.balance += amount;
  await pupil.save();

  res.json({ message: `Added ${amount} credits to ${email}.`, newBalance: pupil.balance });
});

module.exports = router;
