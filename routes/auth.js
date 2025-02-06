const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth'); // Correctly destructure
const Joi = require('joi');

const router = express.Router();
const SECRET = process.env.JWT_SECRET; // Move to top to avoid redeclaring

// Registration route
router.post('/register', async (req, res) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('user', 'admin', 'pupil', 'teacher', 'parent').required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();

    // Include role in token payload
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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

    // Include role in token payload
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role }, 
      SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user info (protected route)
router.get('/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

module.exports = router;
