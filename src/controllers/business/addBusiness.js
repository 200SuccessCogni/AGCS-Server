const businessModel = require('../../models/business');
const joi = require('joi');

const addBusiness = async (req, res, next) => {
    let reqPayload = req.body;

    let businessObj = {
        name: reqPayload.name ? reqPayload.name : '',
        originCountry: reqPayload.originCountry ? reqPayload.originCountry : '',
        address: reqPayload.address ? reqPayload.address : '',
        uid: reqPayload.uid ? reqPayload.uid : '',
        useNlp: reqPayload.useNlp? reqPayload.useNlp:'',
        domain: reqPayload.domain ? reqPayload.domain : '',
        webUrl: reqPayload.webUrl ? reqPayload.webUrl : ''
    }

    const schema = joi.object({
        name: joi.string().required(),
        originCountry: joi.string().required(),
        address: joi.string().required(),
        uid: joi.string().required(),
        useNlp: joi.boolean().required(),
        domain: joi.string().allow(''),
        webUrl: joi.string().allow(''),
    })

    let result = schema.validate(businessObj)

    if (result.error) {
        let errMsg = "Invalid business form";
        next(errMsg);
    } else {
        // Create business document
        businessModel.create(businessObj)
            .then((business) => {
                if (business) {
                    let response = {
                        data: '',
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to create business"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Creating business'
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

module.exports = { addBusiness}