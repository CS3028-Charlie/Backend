const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const User = require("../models/User");
const mongoose = require("mongoose");

// Purchase card endpoint
router.post("/purchase", authenticate, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Set CORS headers explicitly
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        
        const { type, imageData } = req.body;
        const requiredCredits = type === 'eCard' ? 100 : 200;

        // Find the user and include balance field
        const user = await User.findById(req.user.id)
            .session(session);

        if (!user) {
            throw new Error('User not found');
        }

        console.log('Balance check:', {
            userId: user._id,
            currentBalance: user.balance,
            requiredCredits: requiredCredits,
            type: type
        });

        // Check if user has enough balance
        if (user.balance < requiredCredits) {
            await session.abortTransaction();
            return res.status(400).json({
                message: `Insufficient balance. Required: ${requiredCredits}, Available: ${user.balance}`,
                requiredCredits,
                availableBalance: user.balance
            });
        }

        // Deduct from balance
        user.balance -= requiredCredits;
        await user.save({ session });

        // Add purchase to history
        user.purchases = user.purchases || [];
        user.purchases.push({
            cardType: type,
            credits: requiredCredits,
            purchaseDate: new Date()
        });
        await user.save({ session });

        await session.commitTransaction();

        // Send the file as download
        if (imageData) {
            const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            
            res.writeHead(200, {
                'Access-Control-Allow-Origin': req.headers.origin,
                'Access-Control-Allow-Credentials': 'true',
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename=${type}-${Date.now()}.png`,
                'Content-Length': buffer.length
            });
            return res.end(buffer);
        }

        return res.status(200).json({
            message: 'Purchase successful',
            remainingBalance: user.balance
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Purchase error:', error);
        return res.status(500).json({
            message: "Purchase failed",
            error: error.message
        });
    } finally {
        session.endSession();
    }
});

// Add OPTIONS handler
router.options("/purchase", (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).send();
});

module.exports = router;
