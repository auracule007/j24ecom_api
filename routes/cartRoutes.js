const cartController = require("../controllers/cartController");
const { auth } = require("../middlewares/auth");
const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: API endpoints for managing the shopping cart
 */

/**
 * @swagger
 * /api/add-to-cart:
 *   post:
 *     summary: Add a product to the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product to add
 *               quantity:
 *                 type: integer
 *                 description: The quantity of the product
 *     responses:
 *       200:
 *         description: Product successfully added to the cart
 *       400:
 *         description: Product not found or invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/api/add-to-cart", auth, cartController.addToCart);

/**
 * @swagger
 * /api/carts:
 *   get:
 *     summary: Retrieve the current user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of products in the cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                         description: The ID of the product
 *                       quantity:
 *                         type: integer
 *                         description: The quantity of the product
 *                       amount:
 *                         type: number
 *                         format: float
 *                         description: The total amount for the product
 *       400:
 *         description: No carts found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/api/carts", auth, cartController.getCart);

/**
 * @swagger
 * /api/update-cart-items:
 *   put:
 *     summary: Update the quantity of an item in the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product to update
 *               quantity:
 *                 type: integer
 *                 description: The new quantity for the product
 *     responses:
 *       200:
 *         description: Cart item successfully updated
 *       400:
 *         description: Product or cart not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put("/api/update-cart-items", auth, cartController.updateCart);

/**
 * @swagger
 * /api/delete-cart-items:
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product to remove
 *     responses:
 *       200:
 *         description: Cart item successfully deleted
 *       400:
 *         description: Product or cart not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/api/delete-cart-items", auth, cartController.deleteCart);

module.exports = router;
