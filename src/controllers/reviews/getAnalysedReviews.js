const reviewModel = require("../../models/review");
const mongoose = require('mongoose');

// Middleware to get all saved reviews also filter the reviews
const getReviews = async (req,res,next) => {

    let startDate = req.query.startDate?req.query.startDate:'';
    let endDate = req.query.endDate?req.query.endDate:'';
    let source = req.query.source?req.query.source.split(','):'';
    let category = req.query.category?req.query.category.split(','):'';
    let rating = req.query.rating? req.query.rating:''
    console.log(category)

    let filter = {
        businessId: req.query.businessId?new mongoose.Types.ObjectId(req.query.businessId):'',
        locationId: req.query.locationId?new mongoose.Types.ObjectId(req.query.locationId):'',
    }
    
    // Date filtering;
    if(startDate && endDate){
        filter.date = {
            $gte: startDate, 
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

    console.log(filter);
    reviewModel.aggregate([
        {$match:filter}
        // {$group:{_id:'$category',count:{$sum:1}}}
    ]).exec().then((doc)=>{
        let response = {
            data: doc,
            code: 0,
            msg: 'Success'
        }
        res.send(response)
    }).catch((err)=>{
        errMsg = 'Error in fetching review'
        next(errMsg)
    });
} 

module.exports = {getReviews}