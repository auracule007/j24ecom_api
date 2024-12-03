const authControllers = require("../controllers/authControllers");
const express = require("express");
const router = express.Router();

router.post("/api/register", authControllers.register); 
router.post("/api/login", authControllers.login); 


module.exports = router;


