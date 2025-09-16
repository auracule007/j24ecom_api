const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: API endpoints for managing products
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - name
 *               - description
 *               - price
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
 *                 type: integer
 *                 description: The price of the product
 *               featured:
 *                 type: boolean
 *                 description: Whether the product is featured
 *               trending:
 *                 type: boolean
 *                 description: Whether the product is trending
 *               make:
 *                 type: string
 *                 description: Product make (for vehicles)
 *               model:
 *                 type: string
 *                 description: Product model (for vehicles)
 *               year:
 *                 type: integer
 *                 description: Product year (for vehicles)
 *               mileage:
 *                 type: integer
 *                 description: Product mileage (for vehicles)
 *               engine:
 *                 type: string
 *                 description: Product engine details
 *               transmission:
 *                 type: string
 *                 description: Product transmission type
 *               fuelType:
 *                 type: string
 *                 description: Product fuel type
 *               loadCapacity:
 *                 type: string
 *                 description: Product load capacity
 *               condition:
 *                 type: string
 *                 description: Product condition
 *               features:
 *                 type: string
 *                 description: JSON array of product features
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: The main product image
 *               additionalImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images
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
router.post('/api/products', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 10 }
]), productController.createProduct);

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
 *                         type: integer
 *                         description: Product price
 *                       image:
 *                         type: string
 *                         description: Main product image URL
 *                       featured:
 *                         type: boolean
 *                         description: Whether the product is featured
 *                       trending:
 *                         type: boolean
 *                         description: Whether the product is trending
 *                       category:
 *                         type: object
 *                         description: Category details of the product
 *                       features:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             feature:
 *                               type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             imageUrl:
 *                               type: string
 *       404:
 *         description: No products found
 *       500:
 *         description: Internal server error
 */
router.get('/api/products', productController.getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Product details
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/api/products/:id', productController.getSingleProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the product
 *               description:
 *                 type: string
 *                 description: The product description
 *               price:
 *                 type: integer
 *                 description: The price of the product
 *               featured:
 *                 type: boolean
 *                 description: Whether the product is featured
 *               trending:
 *                 type: boolean
 *                 description: Whether the product is trending
 *               make:
 *                 type: string
 *                 description: Product make (for vehicles)
 *               model:
 *                 type: string
 *                 description: Product model (for vehicles)
 *               year:
 *                 type: integer
 *                 description: Product year (for vehicles)
 *               mileage:
 *                 type: integer
 *                 description: Product mileage (for vehicles)
 *               engine:
 *                 type: string
 *                 description: Product engine details
 *               transmission:
 *                 type: string
 *                 description: Product transmission type
 *               fuelType:
 *                 type: string
 *                 description: Product fuel type
 *               loadCapacity:
 *                 type: string
 *                 description: Product load capacity
 *               condition:
 *                 type: string
 *                 description: Product condition
 *               features:
 *                 type: string
 *                 description: JSON array of product features
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: The main product image
 *               additionalImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: "Product updated successfully"
 *                 data:
 *                   type: object
 *                   description: Updated product details
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/api/products/:id', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 10 }
]), productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: "Product deleted successfully"
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.delete('/api/products/:id', productController.deleteProduct);

module.exports = router;