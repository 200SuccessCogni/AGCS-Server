const express = require("express");
const router = express.Router();
const controllers = require("../controllers/auth");

router.post("/auth/signin", controllers.login);
router.post("/auth/signup", controllers.signUp);

module.exports = router;