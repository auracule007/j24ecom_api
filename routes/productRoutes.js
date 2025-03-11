const productController = require("../controllers/productController");
const express = require("express");
const uploads = require("../middlewares/upload");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: API endpoints for managing products
 */

/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: The ID of the product category
 *               name:
 *                 type: string
 *                 description: The name of the product
 *               description:
 *                 type: string
 *                 description: The product description
 *               price:
 *                 type: number
 *                 format: float
 *                 description: The price of the product
 *               featured:
 *                 type: boolean
 *                 description: Whether the product is featured
 *               trending:
 *                 type: boolean
 *                 description: Whether the product is trending
 *               img:
 *                 type: string
 *                 format: binary
 *                 description: The product image file
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: "Product created successfully"
 *                 data:
 *                   type: object
 *                   description: Product details
 *       400:
 *         description: Invalid category ID or product creation failed
 *       500:
 *         description: Internal server error
 */
router.post("/api/product", uploads.single("img"), productController.createProduct);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Retrieve all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Product ID
 *                       name:
 *                         type: string
 *                         description: Product name
 *                       description:
 *                         type: string
 *                         description: Product description
 *                       price:
 *                         type: number
 *                         format: float
 *                         description: Product price
 *                       featured:
 *                         type: boolean
 *                         description: Whether the product is featured
 *                       trending:
 *                         type: boolean
 *                         description: Whether the product is trending
 *                       category:
 *                         type: object
 *                         description: Category details of the product
 *       400:
 *         description: No products found
 *       500:
 *         description: Internal server error
 */
router.get("/api/products", productController.getProduct);

module.exports = router;
