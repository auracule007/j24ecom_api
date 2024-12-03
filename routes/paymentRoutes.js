const paymentControllers = require("../controllers/paymentControllers");
const { auth } = require("../middlewares/auth")
const express = require("express");
const router = express.Router();

router.post("/api/initiate-payment", auth, paymentControllers.initiatePayment)
router.post("/api/verify-payment", auth, paymentControllers.verifyPayment)

module.exports = router;