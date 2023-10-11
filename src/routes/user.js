const express = require("express");
const router = express.Router();
const findBusinessController = require("../controllers/business/findBusiness");
const addUserController = require("../controllers/user/addUser");
const editUserController = require("../controllers/user/editUser");
const deleteUserController = require("../controllers/user/deleteUser");

// Api to add,edit and delete user
router.post("/user/add",[findBusinessController.findBusinessById,addUserController.addUser]);
router.post("/user/edit",editUserController.editUser);
router.post("/user/delete",deleteUserController.deleteUser);

module.exports = router;
