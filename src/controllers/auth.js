const express = require('express');
const router = express.Router();
const userModel = require('../models/user');
const jwt = require('jsonwebtoken');
const joi = require('joi');
const { JWT_User } = require('../../process');
const review = require('./review');

const login = async (req, res, next) => {
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



const signUp = (req, res, next) => {
    let reqPayload = req.body;

    let userObj = {
        name: reqPayload.name ? reqPayload.name : '',
        email: reqPayload.email ? reqPayload.email : '',
        mobile: reqPayload.mobile ? reqPayload.mobile : '',
        organization: reqPayload.organization ? reqPayload.organization : '',
        employeeId: reqPayload.employeeId ? reqPayload.employeeId : '',
        password: reqPayload.password ? reqPayload.password : ''
    }

    const schema = joi.object({
        name: joi.string().required(),
        email: joi.string().required(),
        mobile: joi.number().required(),
        organization: joi.string().required(),
        employeeId: joi.string().required(),
        password: joi.string().required(),
    })

    let result = schema.validate(userObj)

    if (result.error) {
        let errMsg = "Invalid registration form";
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
                    let errMsg = "Unable to create profile"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Creating profile'
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

// Token authentication
const verifyToken = (req, res, next) => {
    if (!req.headers.authorization) {

        error = {
            data: '',
            code: 4,
            msg: 'Unauthorized request'
        }
        return res.status(401).send(error)
    }

    let token = req.headers.authorization.split(' ')[1]

    if (token === 'null') {
        error = {
            data: '',
            code: 4,
            msg: 'Unauthorized request'
        }
        return res.status(401).send(error)
    }

    let payload = jwt.verify(token, JWT_User)

    if (!payload) {
        error = {
            data: '',
            code: 4,
            msg: 'Unauthorized request'
        }
        return res.status(401).send(error)
    }

    req.userId = payload.payload
    next()
}

module.exports = { login, signUp, verifyToken }