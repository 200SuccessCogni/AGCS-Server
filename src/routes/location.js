const express = require("express");
const router = express.Router();
const verifyTokenController = require("../controllers/auth/verifyToken");
const addLocationController = require("../controllers/location/addLocation");
const editLocationController = require("../controllers/location/editLocation");
const deleteLocationController = require("../controllers/location/deleteLocation");
const findLocationController = require("../controllers/location/findLocation");

// Api to add,edit,delete and fetch all location
router.post("/location/add",[verifyTokenController.verifyToken,addLocationController.addLocation]);
router.post("/location/addMultiple",addLocationController.addMultipleLocation);
router.post("/location/edit",[verifyTokenController.verifyToken,editLocationController.editLocation]);
router.post("/location/delete",[verifyTokenController.verifyToken,deleteLocationController.deleteLocation]);
router.get("/location/getAll",[verifyTokenController.verifyToken,findLocationController.findAllBusinessLocation]);
router.get("/location/getById",[verifyTokenController.verifyToken,findLocationController.findLocationById]);

module.exports = router;
