const locationModel = require('../../models/location');
const joi = require('joi');

const editLocation = async (req, res, next) => {
    let reqPayload = req.body;

    let locationId = {_id:reqPayload.locationId?reqPayload.locationId:''}

    let locationObj = {
        locationId: reqPayload.locationId?reqPayload.locationId:'',
        locationName: reqPayload.locationName ? reqPayload.locationName : '',
        city:reqPayload.city?reqPayload.city:'',
        state:reqPayload.state?reqPayload.state:'',
        country:reqPayload.country?reqPayload.country:'',
        address: reqPayload.address ? reqPayload.address : '',
        source: reqPayload.source ? reqPayload.source : '',
        url: reqPayload.url ? reqPayload.url : '',
        accountId: reqPayload.accountId ? reqPayload.accountId : '',
        sourceLocationId: reqPayload.sourceLocationId? reqPayload.sourceLocationId: '',
        hashtags: reqPayload.hashtags && Array.isArray(reqPayload.hashtags)?[...reqPayload.hashtags]: []
    }

    let options = {
        new: true
    }

    const schema = joi.object({
        locationId: joi.string().required(),
        locationName: joi.string().required(),
        city:joi.string().required(),
        state:joi.string().required(),
        country:joi.string().required(),
        address: joi.string().required(),
        source: joi.string().required(),
        url: joi.string().allow(''),
        accountId: joi.string().allow(''),
        sourceLocationId: joi.string().allow(''),
        hashtags: joi.array().items({})
    })

    let result = schema.validate(locationObj)

    if (result.error) {
        let errMsg = "Invalid location form";
        next(errMsg);
    } else {
        // Edit location document
        locationModel.findOneAndUpdate(locationId,locationObj,options)
            .then((location) => {
                if (location) {
                    let response = {
                        data: location,
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to edit location"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Editing location'
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

module.exports = { editLocation}