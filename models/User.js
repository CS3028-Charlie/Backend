const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: { type: String, enum: ["parent", "teacher", "pupil", "admin"], default: "pupil" },
    balance: { type: Number, default: 0 },
    teacherId: { type: String, default: "" } // Stores the teacher's ID
});

module.exports = mongoose.model("User", userSchema);
