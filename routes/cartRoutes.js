const cartController = require("../controllers/cartController");
const { auth } = require("../middlewares/auth")
const express = require("express")
const router = express.Router()

router.post("/api/add-to-cart", auth, cartController.addToCart)
router.get("/api/carts", auth, cartController.getCart)
router.put("/api/update-cart-items", auth, cartController.updateCart)
router.delete("/api/delete-cart-items", auth, cartController.deleteCart)



module.exports = router;