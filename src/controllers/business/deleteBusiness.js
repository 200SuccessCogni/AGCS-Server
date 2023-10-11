const businessModel = require('../../models/business');
const joi = require('joi');

const deleteBusiness = async (req, res, next) => {
    let reqPayload = req.body;

    let businessId = {_id:reqPayload.businessId?reqPayload.businessId:''}

    let businessObj = {
        businessId:reqPayload.businessId?reqPayload.businessId:'',
    }

    const schema = joi.object({
        businessId: joi.string().required(),
    })

    let result = schema.validate(businessObj)

    if (result.error) {
        let errMsg = "Invalid business id";
        next(errMsg);
    } else {
        // Delete business document
        businessModel.findOneAndDelete(businessId)
            .then((business) => {
                if (business) {
                    let response = {
                        data: '',
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to delete business"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Deleting business'
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

module.exports = { deleteBusiness }