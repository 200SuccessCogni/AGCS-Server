const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review");
const verifyLogin = require("../controllers/auth");

// Api to fetch and save all reviews from third party
router.post("/review/saveReviews",[verifyLogin.verifyToken,reviewController.addReviewSources, reviewController.fetchSourceSeggregator,
                                 reviewController.sentimentAnalysis,reviewController.saveProcessedReview],reviewController.fetchEntityAnalysis );
router.get("/review/getall",verifyLogin.verifyToken,reviewController.getReviews);
router.get("/review/reviewStats",verifyLogin.verifyToken, reviewController.fetchReviewStats);
router.get("/review/reviewRecommendations",verifyLogin.verifyToken, reviewController.fetchRecommendations);
router.put("/review/updateReview",verifyLogin.verifyToken, reviewController.updateReviewById);
router.post("/review/fetchEntity",reviewController.entityAnalysis);
router.post("/review/genAi",reviewController.recommendation);

module.exports = router;
