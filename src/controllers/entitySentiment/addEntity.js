const entityModel = require('../../models/entities');
const joi = require('joi');

const addEntity = async (req, res, next) => {
    let reqPayload = req.body;

    let filter = {
        businessId: reqPayload.businessId ? reqPayload.businessId : '',
    }

    let entitiesArr = {
        "$addToSet":{entities: Array.isArray(reqPayload.entities)?[...reqPayload.entities]:[]}
    }

    let entityObj = {
        businessId: reqPayload.businessId ? reqPayload.businessId : '',
        entities: Array.isArray(reqPayload.entities)?[...reqPayload.entities]:[]
    }

    let options={
        upsert: true,
        new: true
    }

    const schema = joi.object({
        businessId: joi.string().required(),
        entities: joi.array().items(joi.string()).required(),
    })

    let result = schema.validate(entityObj)

    if (result.error) {
        let errMsg = "Invalid entity form";
        next(errMsg);
    } else {
        // Create entity document
        entityModel.findOneAndUpdate(filter,entitiesArr,options)
            .then((business) => {
                if (business) {
                    let response = {
                        data: '',
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to create entity"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Creating entity'
                    next('Error in ' + errMsg)
                } else if (err.errors) {
                    let message = err.toString().split(":");
                    let errMsg = message[2].split(",");
                    next(errMsg[0])
                }else if(err.code == "11000"){
                    let errMsg = 'Duplicate entity entered'
                    next(errMsg)
                } else {
                    next(err)
                }
            })
    }
}

module.exports = { addEntity}