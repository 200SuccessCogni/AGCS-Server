const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviews/getAnalysedReviews");
const insightAnalyticsController = require('../controllers/insightAnalytics/getInsightAnalytics');
const summarizedInsightAnalyticsController = require('../controllers/insightAnalytics/getSummarizedInsightAnalytics');
const deleteReviewController = require('../controllers/reviews/deleteReviews');
const verifyLogin = require("../controllers/auth/verifyToken");
// const sentimentController = require('../controllers/sentimentAnalyzer')

// Api to fetch and save all reviews from third party
// router.post("/review/saveReviews",[verifyLogin.verifyToken,reviewController.addReviewSources, reviewController.fetchSourceSeggregator,
//                                  reviewController.sentimentAnalysis,reviewController.saveProcessedReview],reviewController.fetchEntityAnalysis );
router.get("/review/getall",[verifyLogin.verifyToken,reviewController.getReviews]);
router.get("/review/getCategories",[verifyLogin.verifyToken,insightAnalyticsController.fetchInsightAnalytics]);
router.get("/review/getInsightAnalytics",[verifyLogin.verifyToken,summarizedInsightAnalyticsController.fetchInsightAnalytics]);
router.post("/review/getInsightSummaries",[verifyLogin.verifyToken,summarizedInsightAnalyticsController.generateDescSummary]);
router.post("/review/deleteMulti",deleteReviewController.deleteMultiReview);
router.post("/review/deleteById",deleteReviewController.deleteReviewById);

module.exports = router;
