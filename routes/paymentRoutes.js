const paymentControllers = require("../controllers/paymentControllers");
const { auth } = require("../middlewares/auth");
const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: API endpoints for payment processing
 */

/**
 * @swagger
 * /api/initiate-payment:
 *   post:
 *     summary: Initiate a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: The first name of the payer
 *               lastName:
 *                 type: string
 *                 description: The last name of the payer
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the payer
 *               address:
 *                 type: string
 *                 description: The address of the payer
 *               phone:
 *                 type: string
 *                 description: The phone number of the payer
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: The amount to be paid
 *     responses:
 *       200:
 *         description: Payment successfully initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment successful"
 *                 data:
 *                   type: string
 *                   description: Payment link for the transaction
 *                 orderId:
 *                   type: string
 *                   description: Unique identifier for the order
 *       400:
 *         description: User not found or cart is empty
 *       500:
 *         description: Internal server error
 */
router.post("/api/initiate-payment", auth, paymentControllers.initiatePayment);

/**
 * @swagger
 * /api/verify-payment:
 *   post:
 *     summary: Verify a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transaction_Id:
 *                 type: string
 *                 description: The unique ID of the transaction
 *               orderId:
 *                 type: string
 *                 description: The unique ID of the order associated with the payment
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order created successfully"
 *                 data:
 *                   type: object
 *                   description: Order details including transaction ID and amount
 *       400:
 *         description: Payment failed, cart not found, or cart is empty
 *       500:
 *         description: Internal server error
 */
router.post("/api/verify-payment", auth, paymentControllers.verifyPayment);

module.exports = router;
