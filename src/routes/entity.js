const express = require("express");
const router = express.Router();
const verifyTokenController = require("../controllers/auth/verifyToken");
const addEntityController = require("../controllers/entitySentiment/addEntity");
const deleteEntitySentimentController = require("../controllers/entitySentiment/deleteEntitySentiments");

// Api to add,edit,delete and fetch all location
router.post("/entity/deleteMulti",deleteEntitySentimentController.deleteMultiEntitySentiment);

module.exports = router;
