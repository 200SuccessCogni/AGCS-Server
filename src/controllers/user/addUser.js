const userModel = require('../../models/user');
const joi = require('joi');

const addUser = async (req, res, next) => {
    let reqPayload = req.body;

    let userObj = {
        businessId: reqPayload.businessId ? reqPayload.businessId : '',
        name: reqPayload.name ? reqPayload.name : '',
        employeeId: reqPayload.employeeId ? reqPayload.employeeId : '',
        email: reqPayload.email ? reqPayload.email : '',
        mobile: reqPayload.mobile ? reqPayload.mobile : '',
        password: reqPayload.password ? reqPayload.password : '',
        permissionLevel: reqPayload.permissionLevel?reqPayload.permissionLevel:'',
    }

    const schema = joi.object({
        businessId: joi.string().required(),
        name: joi.string().required(),
        employeeId: joi.string().required(),
        email: joi.string().required(),
        mobile: joi.number().required(),
        password: joi.string().required(),
        permissionLevel: joi.number().required(),
    })

    let result = schema.validate(userObj)

    if (result.error) {
        let errMsg = "Invalid user form";
        next(errMsg);
    } else {
        // Create user document
        userModel.create(userObj)
        .then((user) => {
            if (user) {
                let response = {
                    data: '',
                    code: 0,
                    msg: 'Success'
                }
                res.send(response)
            } else {
                let errMsg = "Unable to create user"
                next(errMsg)
            }
        })
        .catch((err) => {
            if (err.path) {
                errMsg = err.path ? err.path : 'Creating user'
                next('Error in ' + errMsg)
            } else if (err.errors) {
                let message = err.toString().split(":");
                let errMsg = message[2].split(",");
                next(errMsg[0])
            } else {
                next(err)
            }
        })

    }
}

module.exports = { addUser };