const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth/auth");

router.post("/auth/signin", authController.authorize);

module.exports = router;