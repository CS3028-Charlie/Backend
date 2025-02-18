const express = require("express");
const router = express.Router();
const {authenticate} = require("../middleware/auth");
const User = require("../models/User");

// Get students in a teacher's class
router.get("/students", authenticate, async (req, res) => {
    if (req.user.role !== "teacher") return res.status(403).json({ message: "Access denied" });

    try {
        const students = await User.find({ role: "pupil" }, "username email balance");
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Add student to class
router.post("/add-student", authenticate, async (req, res) => {
    if (req.user.role !== "teacher") return res.status(403).json({ message: "Access denied" });

    const { email } = req.body;

    try {
        const student = await User.findOne({ email, role: "pupil" });
        if (!student) return res.status(404).json({ message: "Student not found" });

        res.json({ message: "Student added successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Add credits to multiple students
router.post("/add-credits", authenticate, async (req, res) => {
    if (req.user.role !== "teacher") return res.status(403).json({ message: "Access denied" });

    const { emails, amount } = req.body;

    try {
        await User.updateMany({ email: { $in: emails } }, { $inc: { balance: amount } });
        res.json({ message: "Credits added successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/remove-students", authenticate, async (req, res) => {
    const { emails } = req.body;
    const teacherId = req.user.id;

    try {
        const students = await User.find({ email: { $in: emails }, teacherId });

        if (students.length === 0) return res.status(404).json({ message: "No matching students found" });

        await User.deleteMany({ email: { $in: emails }, teacherId });
        res.json({ message: `${students.length} students removed successfully` });
    } catch (error) {
        res.status(500).json({ message: "Error removing students" });
    }
});

module.exports = router;
