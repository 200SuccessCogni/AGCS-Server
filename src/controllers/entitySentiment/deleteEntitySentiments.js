const entitySentimentModel = require('../../models/entitySentiment');
const joi = require('joi');

const deleteMultiEntitySentiment = async (req, res, next) => {
    let reqPayload = req.body;

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
        // Delete entity documents
        entitySentimentModel.deleteMany(businessObj)
            .then((business) => {
                if (business) {
                    let response = {
                        data: business,
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to delete entites"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Deleting entities'
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

const deleteEntitySentimentById = async (req, res, next) => {
    let reqPayload = req.body;

    let entityId = {_id:reqPayload.entityId?reqPayload.entityId:''}

    let entityObj = {
        entityId:reqPayload.entityId?reqPayload.entityId:'',
    }

    const schema = joi.object({
        entityId: joi.string().required(),
    })

    let result = schema.validate(entityObj)

    if (result.error) {
        let errMsg = "Invalid review id";
        next(errMsg);
    } else {
        // Delete entity document
        entitySentimentModel.findByIdAndDelete(entityId)
            .then((business) => {
                if (business) {
                    let response = {
                        data: '',
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to delete entity"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Deleting entity'
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

module.exports = { deleteMultiEntitySentiment,deleteEntitySentimentById }