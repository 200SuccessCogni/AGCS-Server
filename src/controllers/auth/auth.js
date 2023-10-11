const userModel = require('../../models/user');
const businessModel = require('../../models/business');
const jwt = require('jsonwebtoken');
const joi = require('joi');
const { JWT_User } = require('../../../process');

const authorize = async (req, res, next) => {
    let reqPayload = req.body

    const schema = joi.object({
        email: joi.string().required(),
        password: joi.string().required()
    })

    let result = schema.validate(reqPayload);

    if (result.error) {
        let errMsg = "Invalid login form";
        next(errMsg)
    } else {
        // Checks user collection for matching email id and password
        userModel.findOne({ email: reqPayload.email })
            .populate({path:'businessId', model:businessModel})
            .then((user) => {
                let response = "";
                if (!user) {
                    response = {
                        data: '',
                        code: 2,
                        msg: 'User not registered'
                    }
                } else {

                    if (reqPayload.password !== user.password) {
                        response = {
                            data: '',
                            code: 1,
                            msg: 'Incorrect password'
                        }
                    } else {
                        let payload = user._id
                        let token = jwt.sign({ payload }, JWT_User)

                        response = {
                            data: { token: token, user: user },
                            code: 0,
                            msg: 'Success'
                        }
                    }
                }
                res.send(response)

            }).then()
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Login'
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

module.exports = { authorize }