const authControllers = require("../controllers/authControllers");
const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Endpoints for user authentication and account management
 */

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the user
 *               firstName:
 *                 type: string
 *                 description: The user's first name
 *               lastName:
 *                 type: string
 *                 description: The user's last name
 *               phone:
 *                 type: string
 *                 description: The user's phone number
 *               address:
 *                 type: string
 *                 description: The user's address
 *               role:
 *                 type: string
 *                 description: The user's role (e.g., "admin" or "user")
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirmation of the password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists, password mismatch, or invalid input
 *       500:
 *         description: Internal server error
 */
router.post("/api/register", authControllers.register);

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "You are now logged in"
 *                 token:
 *                   type: string
 *                   description: The authentication token for accessing protected routes
 *       400:
 *         description: Invalid credentials or user not found
 *       500:
 *         description: Internal server error
 */
router.post("/api/login", authControllers.login);

module.exports = router;
