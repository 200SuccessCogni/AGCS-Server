const express = require("express");
const router = express.Router();
const resortController = require("../controllers/resort");
const verifyLogin = require("../controllers/auth");

router.post("/resort/addResort",verifyLogin.verifyToken,resortController.createResort);
router.get("/resort/getAllResort",verifyLogin.verifyToken ,resortController.getResort);
router.get("/resort/getResort/:id",verifyLogin.verifyToken,resortController.getResortById);
router.get("/resort/fetchStats",[verifyLogin.verifyToken,resortController.fetchStats],resortController.addStats);
router.get("/resort/getStats",verifyLogin.verifyToken,resortController.getStats);


module.exports = router;
