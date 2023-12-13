const reviewModel = require("../../models/review");
const mongoose = require('mongoose');

// Middleware to get all saved reviews also filter the reviews
const getReviews = async (req,res,next) => {

    let startDate = req.query.startDate?req.query.startDate:'';
    let endDate = req.query.endDate?req.query.endDate:'';
    let source = req.query.source?req.query.source.split(','):'';
    let category = req.query.category?req.query.category.split(','):'';
    let rating = req.query.rating? req.query.rating:''

    if(!req.query.businessId || !req.query.locationId ){
        response = {
            data: '',
            code: 1,
            msg: 'Missing query param'
        }
        res.send(response)
    }

    let filter = {
        businessId: req.query.businessId?new mongoose.Types.ObjectId(req.query.businessId):'',
        locationId: req.query.locationId?new mongoose.Types.ObjectId(req.query.locationId):'',
    }

    if(req.query.productId && req.query.productId != 'undefined' && req.query.productId != 'null'){
        filter['product'] = req.query.productId
    }

    let response = {
        data: '',
        code: 0,
        msg: ''
    }
    
    let skip = parseInt(req.query.skip)
    let limit = parseInt(req.query.limit)
    // Date filtering;
    if(startDate){
        filter.date = {
            $gte: startDate
        }
    }

    if(endDate){
        filter.date = {
            $lt: endDate
        }
    }

    // Source Filtering
    if(source){
        filter.source = {$in:[...source]}
    }

    // Review category Filtering
    if(category){
        filter.category = {$in:[...category]}
    }

    // Rating Filtering
    if(rating){
        filter.rating = parseInt(rating)
    }

    try{
        let reviews = await reviewModel.aggregate([
            {$match:filter},
            // {$skip:skip},
            // {$limit:limit}
            // {$group:{_id:'$category',count:{$sum:1}}}
        ])

        if(reviews){
            response = {
                data: reviews,
                code: 0,
                msg: 'Success'
            }
        }else{
            response = {
                data: [],
                code: 0,
                msg: 'Success'
            }
        }
        res.send(response)
    }catch(err){
        console.log(err)
        errMsg = 'Error in fetching review'
        next(errMsg)
    };
} 

module.exports = {getReviews}