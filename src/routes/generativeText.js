const express = require("express");
const router = express.Router();
const verifyTokenController = require("../controllers/auth/verifyToken");
const genRecommendationController = require("../controllers/generativeText/recommendation");
const genReplyController = require("../controllers/generativeText/response");

// Api to generate recommendations and responses to reviews
router.post("/gen/recommend",[verifyTokenController.verifyToken,genRecommendationController.generateReviewRecommendation]);
router.post("/gen/reply",[verifyTokenController.verifyToken,genReplyController.generateReviewReply]);

module.exports = router;
