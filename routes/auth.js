const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

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
    if (existingUser) return res.status(400).json({ message: 'User with this email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const balance = role === 'pupil' ? 0 : undefined; // Initialize balance for pupils

    const newUser = new User({ username, email, password: hashedPassword, role, balance });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, username: newUser.username, role: newUser.role, balance: balance || 0 });
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
    if (user.role !== 'pupil') return res.status(403).json({ message: 'Access denied' });

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
      return res.status(403).json({ message: 'Unauthorized: Only teachers and parents can top-up credits.' });
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
