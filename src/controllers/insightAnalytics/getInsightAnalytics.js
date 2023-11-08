const reviewModel = require("../../models/review");
const entityModel = require("../../models/entitySentiment");
const mongoose = require('mongoose');
const openAi = require('../../utils/openai');

// Middleware to fetch review stats
const fetchInsightAnalytics = async(req,res,next)=>{

    // let startDate = req.query.startDate?req.query.startDate:'';
    // let endDate = req.query.endDate?req.query.endDate:'';
    // let source = req.query.source?req.query.source.split(','):'';
    // let category = req.query.category?req.query.category:'';
    // let rating = req.query.rating? req.query.rating:''

    let filter = {
        businessId: req.query.businessId?new mongoose.Types.ObjectId(req.query.businessId):'',
        locationId: req.query.locationId?new mongoose.Types.ObjectId(req.query.locationId):'',
    }

    console.log(filter);

    let responseObj = {
        categories : [],
        sources: {},
        insights: [],
        // analytics: [],
    }

    // Review category count
    await reviewModel.aggregate([
        {$match:filter},
        {$group:{_id:'$category',count:{$sum:1}}}
    ]).exec().then((doc)=>{
        if(doc){
            responseObj.categories = [...doc];
        }
    }).catch((err)=>{
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // Review source count
    await reviewModel.aggregate([
        {$match:filter},
        {$group:{_id:'$source',count:{$sum:1}}}
    ]).exec().then((doc)=>{
        if(doc){
            responseObj.sources = {...doc};
        }
    }).catch((err)=>{
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // Review insights i.e average score of the entities
    // Mongodb group function used
    // let insightParams =  ['parking','wellness','housekeeping','spa','bathroom','bedroom','room','kitchen','food','bar','restaurant','pool','breakfast','gym','toilet','shower','bed']
    let insightParams =  ['restaurant','cleanliness','hygeine','food','bathroom','staff','taste','kitchen']
    await entityModel.aggregate([
        {$match:filter},
        {$unwind: '$entityScores'}, 
        {$group:{
            _id:'$entityScores.entityName',
            count:{$sum:1},
            avgScore:{$avg:'$entityScores.sentimentScore'},
            avgMagnitude:{$avg:'$entityScores.sentimentMagnitude'}
        }},
        // {$match:{_id:{$in:insightParams}}}
    ]).exec().then((doc)=>{
        if(doc){
            responseObj.insights = [...doc];
            res.send(responseObj)
        }
    }).catch((err)=>{
        console.log(err)
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // Review analytics i.e. persisting entity scores
    // Mongodb window function
    // await entityModel.aggregate([
    //     {$match:filter},
    //     {$unwind: '$entityScores'},
    //     // {$match:{'entityScores.entityName':{$in:insightParams}}},
    //     {$setWindowFields:{
    //         partitionBy:'$entityScores.entityName',
    //         sortBy: {'entityScores.date':1},
    //         output:{
    //             "avgScore":{
    //                 $avg:"$entityScores.sentimentScore"
    //             }
    //         }
    //     }},
    //     {$project:{"date":1,"entityScores":1,"desc":1}}
    // ]).exec().then((doc)=>{
    //     if(doc){
    //         responseObj.analytics = [...doc];
    //         res.send(responseObj)
    //     }
    // }).catch((err)=>{
    //     console.log(err)
    //     errMsg = 'Error in fetching review'
    //     next(errMsg)
    // });
}

module.exports = { fetchInsightAnalytics}