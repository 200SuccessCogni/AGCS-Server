const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviews/getAnalysedReviews");
const insightAnalyticsController = require('../controllers/insightAnalytics/getInsightAnalytics');
const genAiController = require("../controllers/reviews/fetchReview");
// const verifyLogin = require("../controllers/auth");
// const sentimentController = require('../controllers/sentimentAnalyzer')

// Api to fetch and save all reviews from third party
// router.post("/review/saveReviews",[verifyLogin.verifyToken,reviewController.addReviewSources, reviewController.fetchSourceSeggregator,
//                                  reviewController.sentimentAnalysis,reviewController.saveProcessedReview],reviewController.fetchEntityAnalysis );
router.get("/review/getall",reviewController.getReviews);
router.get("/review/getinsightAnalytics",insightAnalyticsController.fetchInsightAnalytics);
router.post("/review/sentimentGenAI",genAiController.genAiAnalysis);
// router.get("/review/reviewStats",verifyLogin.verifyToken, reviewController.fetchReviewStats);
// router.get("/review/reviewRecommendations",verifyLogin.verifyToken, reviewController.fetchRecommendations);
// router.put("/review/updateReview",verifyLogin.verifyToken, reviewController.updateReviewById);
// router.post("/review/fetchEntity",reviewController.entityAnalysis);
// router.post("/review/genAi",reviewController.recommendation);

// router.post("/review/sentiment",sentimentController.sentimentAnalyze);
// router.post("/review/entity",sentimentController.entityAnalyze);

module.exports = router;
