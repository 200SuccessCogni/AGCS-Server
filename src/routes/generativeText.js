const express = require("express");
const router = express.Router();
const verifyTokenController = require("../controllers/auth/verifyToken");
const genAnalysisController = require("../controllers/reviews/llmSegmentation");
const genRecommendationController = require("../controllers/generativeText/recommendation");
const genReplyController = require("../controllers/generativeText/response");

// Api to generate recommendations and responses to reviews
router.post("/gen/analysis",[verifyTokenController.verifyToken, genAnalysisController.genAiAnalysis]);
router.post("/gen/recommend",[verifyTokenController.verifyToken,genRecommendationController.generateReviewRecommendation]);
router.post("/gen/reply",[verifyTokenController.verifyToken,genReplyController.generateReviewReply]);

module.exports = router;
