const locationModel = require('../../models/location');
const joi = require('joi');

const findLocationById = async (req, res, next) => {
    let reqQueryParam = req.query?req.query:'';

    let locationId = {_id:reqQueryParam.locationId?reqQueryParam.locationId:''}

    let locationObj = {
        locationId: reqQueryParam.locationId ? reqQueryParam.locationId : '',
    }

    const schema = joi.object({
        locationId: joi.string().required(),
    })

    let result = schema.validate(locationObj)

    if (result.error) {
        let errMsg = "Invalid location form";
        next(errMsg);
    } else {
        // Get a location by id
        locationModel.findById(locationId)
            .then((location)=>{
                if(location){
                    let response = {
                        data: location,
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response) 
                }else{
                    let errMsg = 'No location found'
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Finding location'
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

const findAllBusinessLocation = async (req, res, next) => {
    let reqQueryParam = req.query?req.query:'';

    let businessObj = {businessId:reqQueryParam.businessId?reqQueryParam.businessId:''}

    const schema = joi.object({
        businessId: joi.string().required(),
    })

    let result = schema.validate(businessObj)

    if (result.error) {
        let errMsg = "Invalid location form";
        next(errMsg);
    } else {
        // Get all locations for a business
        locationModel.find(businessObj)
            .then((location)=>{
                if(location){
                    let response = {
                        data: location,
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response) 
                }else{
                    let errMsg = 'No location found'
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Finding location'
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

module.exports = { findLocationById,findAllBusinessLocation }