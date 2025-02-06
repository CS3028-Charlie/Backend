const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/auth'); // Fix middleware names
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config();

// PayPal configuration
const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID, 
    process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Route to add funds to a pupil account
router.post('/add-funds', authenticate, authorizeRoles(['teacher', 'parent']), async (req, res) => {
    try {
        const { pupilEmail, amount } = req.body;

        if (!pupilEmail || !amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid request parameters." });
        }

        // Find the pupil account
        const pupil = await User.findOne({ email: pupilEmail, role: 'pupil' });
        if (!pupil) {
            return res.status(404).json({ message: "Pupil account not found." });
        }

        // Create PayPal order
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: "GBP",
                    value: Number(amount.toFixed(2)) // Fix floating point issue
                }
            }]
        });

        const order = await client.execute(request);
        res.json({ orderID: order.result.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Route to capture PayPal payment
router.post('/capture-payment', authenticate, authorizeRoles(['teacher', 'parent']), async (req, res) => {
    try {
        const { orderID, pupilEmail, amount } = req.body;

        if (!orderID || !pupilEmail || amount <= 0) {
            return res.status(400).json({ message: "Invalid request parameters." });
        }

        // Capture PayPal payment
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});
        await client.execute(request);

        // Find the pupil and update balance
        const pupil = await User.findOneAndUpdate(
            { email: pupilEmail, role: 'pupil' },
            { $inc: { balance: amount } }, // Ensure `balance` exists in the User model
            { new: true }
        );

        if (!pupil) {
            return res.status(404).json({ message: "Pupil not found." });
        }

        res.json({ message: "Payment successful!", balance: pupil.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Payment capture failed." });
    }
});

module.exports = router;
