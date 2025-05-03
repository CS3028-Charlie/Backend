const express = require('express');
const paypal = require('@paypal/paypal-server-sdk');
const router = express.Router();

// Initialize PayPal client with credentials and sandbox environment settings
const client = new paypal.Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: process.env.PAYPAL_CLIENT_ID,
        oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    },
    timeout: 0, // No timeout limit
    environment: paypal.Environment.Sandbox, // Use sandbox for testing
    logging: {
        logLevel: paypal.LogLevel.Info,
        logRequest: { logBody: true },
        logResponse: { logHeaders: true },
    },
}); 

// Initialize controllers for handling orders and payments
const ordersController = new paypal.OrdersController(client);
const paymentsController = new paypal.PaymentsController(client);

/**
 * Creates a PayPal order with the given cart details
 * @param {Object} cart - Contains amount and currency information
 * @returns {Promise<Object>} Order creation response with status
 */
const createOrder = async (cart) => {
    // Extract payment details from cart or use defaults
    const amountValue = cart.amount;
    const currencyCode = cart?.currency || "GBP";

    // Prepare the order creation request
    const collect = {
        body: {
            intent: "CAPTURE", // Payment will be captured immediately
            purchaseUnits: [
                {
                    amount: {
                        currencyCode: currencyCode,
                        value: amountValue,
                    },
                },
            ],
        },
        prefer: "return=minimal", // Request minimal response data
    };

    console.log(collect.body);

    try {
        const { body, ...httpResponse } = await ordersController.ordersCreate(
            collect
        );
        // Get more response info...
        // const { statusCode, headers } = httpResponse;
        return {
            jsonResponse: JSON.parse(body),
            httpStatusCode: httpResponse.statusCode,
        };
    } catch (error) {
        if (error instanceof paypal.ApiError) {
            // const { statusCode, headers } = error;
            throw new Error(error.message);
        }
    }
};

// Route handler for order creation
router.post("/orders", async (req, res) => {
    try {
        // Use the cart information passed from the front-end to calculate the order amount details
        const { cart } = req.body;
        const { jsonResponse, httpStatusCode } = await createOrder(cart);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
});

/**
 * Captures payment for an existing order
 * orderID - The ID of the PayPal order to capture
 * returns Promise - Capture response with status
 */
const captureOrder = async (orderID) => {
    // Prepare the capture request
    const collect = {
        id: orderID,
        prefer: "return=minimal",
    };

    try {
        const { body, ...httpResponse } = await ordersController.ordersCapture(
            collect
        );
        // Get more response info...
        // const { statusCode, headers } = httpResponse;
        return {
            jsonResponse: JSON.parse(body),
            httpStatusCode: httpResponse.statusCode,
        };
    } catch (error) {
        if (error instanceof paypal.ApiError) {
            // const { statusCode, headers } = error;
            throw new Error(error.message);
        }
    }
};

// Route handler for payment capture
router.post("/orders/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
});

module.exports = router;