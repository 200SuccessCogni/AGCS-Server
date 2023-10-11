const locationModel = require('../../models/location');
const joi = require('joi');

const deleteLocation = async (req, res, next) => {
    let reqPayload = req.body;

    let locationId = {_id:reqPayload.locationId?reqPayload.locationId:''}

    let locationObj = {
        locationId:reqPayload.locationId?reqPayload.locationId:'',
    }

    const schema = joi.object({
        locationId: joi.string().required(),
    })

    let result = schema.validate(locationObj)

    if (result.error) {
        let errMsg = "Invalid location id";
        next(errMsg);
    } else {
        // Delete location document
        locationModel.findOneAndDelete(locationId)
            .then((business) => {
                if (business) {
                    let response = {
                        data: '',
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to delete location"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Deleting location'
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

module.exports = { deleteLocation }