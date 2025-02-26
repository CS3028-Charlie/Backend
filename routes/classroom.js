const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const User = require("../models/User");
const mongoose = require("mongoose"); // Ensure mongoose is imported

// Get students in a teacher's class
router.get("/students", authenticate, async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        const teacher = await User.findById(req.user.id);
        const teacherId = teacher.teacherId;

        if (!teacherId) {
            console.error("Teacher ID not found");
            return res.status(400).json({ message: "Teacher ID not found" });
        }

        console.log(`Loading students for teacherId ${teacherId}`);

        const students = await User.find(
            { role: "pupil", teacherId: teacherId },
            "username email balance teacherId"
        );

        console.log("Fetched students:", students);

        res.json({ students, teacherId });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Add a student to a teacher's class
router.post("/add-student", authenticate, async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
    }

    const { email } = req.body;
    try {
        const student = await User.findOne({ email, role: "pupil" });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const teacher = await User.findById(req.user.id);
        const teacherId = teacher.teacherId;

        if (!teacherId) {
            return res.status(400).json({ message: "Teacher ID not found" });
        }

        if (student.teacherId !== "") {
            return res.status(400).json({ message: "Student is already assigned to another teacher" });
        }

        student.teacherId = teacherId;
        await student.save();

        console.log(`Assigned teacherId ${teacherId} to student ${student.email}`);

        res.json({ message: "Student added to your class", student });
    } catch (error) {
        console.error("Error adding student:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Remove a student from a teacher's class (sets teacherId to an empty string)
router.delete("/remove-students", authenticate, async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
    }

    const { emails } = req.body;

    try {
        console.log("Removing students with emails:", emails);

        const teacher = await User.findById(req.user.id);
        const teacherId = teacher.teacherId;

        console.log("Using teacherId:", teacherId);

        const result = await User.updateMany(
            { email: { $in: emails }, teacherId: teacherId },
            { $set: { teacherId: "" } }  // Unassign students instead of deleting
        );

        console.log("Update result:", result);

        if (result.modifiedCount > 0) {
            return res.json({ message: "Students removed from your class" });
        } else {
            return res.status(400).json({ message: "No students removed. Check if they exist or belong to you." });
        }
    } catch (error) {
        console.error("Error removing students:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Add credits to students in a teacher's class
router.post("/add-credits", authenticate, async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
    }

    const { emails, amount } = req.body;

    try {
        console.log("Adding credits to students with emails:", emails);
        console.log("Amount to add:", amount);

        const teacher = await User.findById(req.user.id);
        const teacherId = teacher.teacherId;

        console.log("Using teacherId:", teacherId);

        const result = await User.updateMany(
            { email: { $in: emails }, teacherId: teacherId },
            { $inc: { balance: amount } }
        );

        console.log("Update result:", result);

        if (result.modifiedCount > 0) {
            return res.json({ message: "Credits added successfully" });
        } else {
            return res.status(400).json({ message: "No students updated. Check if they exist or belong to you." });
        }
    } catch (error) {
        console.error("Error adding credits:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Withdraw all credits from selected students and give them to the teacher
router.post("/withdraw-credits", authenticate, async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
    }

    const { emails } = req.body;

    try {
        console.log("Withdrawing all credits from students with emails:", emails);

        const teacher = await User.findById(req.user.id);
        const teacherId = teacher.teacherId;

        if (!teacherId) {
            return res.status(400).json({ message: "Teacher ID not found" });
        }

        const students = await User.find({ email: { $in: emails }, role: "pupil", teacherId: teacherId });
        if (students.length === 0) {
            console.log("No students found or they do not belong to the teacher");
            return res.status(404).json({ message: "No students found or they do not belong to you" });
        }

        const totalAmount = students.reduce((sum, student) => sum + student.balance, 0);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            for (const student of students) {
                console.log(`Deducting ${student.balance} credits from student ${student.email}`);
                student.balance = 0;
                await student.save({ session });
            }

            const teacher = await User.findById(req.user.id).session(session);
            teacher.balance += totalAmount;
            await teacher.save({ session });
            console.log(`Added ${totalAmount} credits to teacher ${teacher.email}`);

            await session.commitTransaction();

            res.json({ message: "Credits withdrawn successfully", teacherBalance: teacher.balance });
        } catch (error) {
            await session.abortTransaction();
            console.error("Error during transaction:", error);
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error("Error withdrawing credits:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
