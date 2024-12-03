const productController = require("../controllers/productController");
const express = require("express");
const uploads = require("../middlewares/upload")
const router = express.Router();

router.post("/api/product", uploads.single("img"),productController.createProduct)
router.get("/api/products", productController.getProduct)

module.exports = router;