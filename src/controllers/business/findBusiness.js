const businessModel = require('../../models/business');
const joi = require('joi');

const findBusinessById = async (req, res, next) => {
    let reqPayload = req.body;

    let businessId = {_id:reqPayload.businessId?reqPayload.businessId:''}

    let businessObj = {
        businessId: reqPayload.businessId ? reqPayload.businessId : '',
    }

    const schema = joi.object({
        businessId: joi.string().required(),
    })

    let result = schema.validate(businessObj)

    if (result.error) {
        let errMsg = "Invalid business form";
        next(errMsg);
    } else {
        // Check if the business exists
        businessModel.findById(businessId)
            .then((business)=>{
                if(business){
                    next();
                }else{
                    let errMsg = 'No business found'
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Finding business'
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

module.exports = { findBusinessById }