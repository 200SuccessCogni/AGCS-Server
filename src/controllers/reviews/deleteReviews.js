const reviewModel = require('../../models/review');
const joi = require('joi');

const deleteMultiReview = async (req, res, next) => {
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
        // Delete review documents
        reviewModel.deleteMany(businessObj)
            .then((data) => {
                if (data) {
                    let response = {
                        data: data,
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to delete reviews"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Deleting reviews'
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

const deleteReviewById = async (req, res, next) => {
    let reqPayload = req.body;

    let reviewId = {_id:reqPayload.reviewId?reqPayload.reviewId:''}

    let reviewObj = {
        reviewId:reqPayload.reviewId?reqPayload.reviewId:'',
    }

    const schema = joi.object({
        reviewId: joi.string().required(),
    })

    let result = schema.validate(reviewObj)

    if (result.error) {
        let errMsg = "Invalid review id";
        next(errMsg);
    } else {
        // Delete review document
        reviewModel.findByIdAndDelete(reviewId)
            .then((business) => {
                if (business) {
                    let response = {
                        data: '',
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to delete review"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Deleting review'
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

module.exports = { deleteMultiReview,deleteReviewById }