const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'teacher', 'parent', 'pupil'], default: 'user', required: true },
  balance: { type: Number, default: 0 }  // Only relevant for pupil accounts
});

module.exports = mongoose.model('User', userSchema);
