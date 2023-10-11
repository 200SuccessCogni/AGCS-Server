const express = require("express");
const router = express.Router();
const addBusinessController = require("../controllers/business/addBusiness");
const editBusinessController = require("../controllers/business/editBusiness");
const deleteBusinessController = require("../controllers/business/deleteBusiness");

// Api to add,edit and delete business
router.post("/business/add",addBusinessController.addBusiness);
router.post("/business/edit",editBusinessController.editBusiness);
router.post("/business/delete",deleteBusinessController.deleteBusiness);

module.exports = router;
