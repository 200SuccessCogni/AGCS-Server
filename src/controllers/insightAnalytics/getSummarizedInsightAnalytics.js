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
        // categories : [],
        // sources: {},
        insights: [],
        analytics: [],
    }

    // Review category count
    // await reviewModel.aggregate([
    //     {$match:filter},
    //     {$group:{_id:'$category',count:{$sum:1}}}
    // ]).exec().then((doc)=>{
    //     if(doc){
    //         responseObj.categories = [...doc];
    //     }
    // }).catch((err)=>{
    //     errMsg = 'Error in fetching review'
    //     next(errMsg)
    // });

    // Review source count
    // await reviewModel.aggregate([
    //     {$match:filter},
    //     {$group:{_id:'$source',count:{$sum:1}}}
    // ]).exec().then((doc)=>{
    //     if(doc){
    //         responseObj.sources = {...doc};
    //     }
    // }).catch((err)=>{
    //     errMsg = 'Error in fetching review'
    //     next(errMsg)
    // });

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
        }
    }).catch((err)=>{
        console.log(err)
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // Review analytics i.e. persisting entity scores
    // Mongodb window function
    await entityModel.aggregate([
        {$match:filter},
        {$unwind: '$entityScores'},
        // {$match:{'entityScores.entityName':{$in:insightParams}}},
        {$setWindowFields:{
            partitionBy:'$entityScores.entityName',
            sortBy: {'entityScores.date':1},
            output:{
                "avgScore":{
                    $avg:"$entityScores.sentimentScore"
                }
            }
        }},
        {$project:{"date":1,"entityScores":1,"desc":1}}
    ]).exec().then((doc)=>{
        if(doc){
            responseObj.analytics = [...doc];

            let updatedInsights = responseObj.insights.map(insight=>{
                let descArr = []
                responseObj.analytics.forEach(entity=>{
                    if(insight._id == entity.entityScores.entityName){
                        let checkDuplicate = descArr.find(desc=>desc == entity.desc)
                        if(checkDuplicate == undefined)
                        descArr.push(entity.desc)
                    }
                })
                insight.descArr = [...descArr]
                return insight
            })

            res.send(responseObj)
        }
    }).catch((err)=>{
        console.log(err)
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // if(Array.isArray(responseObj.insights) && responseObj.insights.length>0){
    //     let summarizedReviews = await fetchReviewSummaries(...responseObj.insights)
    //     responseObj.insights = Array.isArray(summarizedReviews) && summarizedReviews.length>0? [...summarizedReviews]:[]
    // }else{
    //     responseObj.insights = []
    // }
}

const fetchReviewSummaries = async(...insights)=>{
    let failedAnalysisArr = [];

    let reviewSummaryMethods = insights.map((insight,i)=>{
        let descArr = [...insight.descArr]
        let reviewString = ''
        descArr.forEach((desc,j)=>{
            reviewString += `Review  ${j+1} - ${desc}`
        })

        return {
            method: generateDescSummary,
            entityName : insight._id,
            reviewString : reviewString
        }
    })

    let batchArr = [];
    let reviewQueue = [];
    let summarizedLength = 0

    reviewSummaryMethods.forEach((review,i)=>{

        // Push the last queue of reviews into the batch array
        if(i == reviewSummaryMethods.length -1){
            reviewQueue.push(review)            
            batchArr.push(reviewQueue)
        }else{
            // If index is divisible by 25, push queue to batch array and empty queue
            if(i!=0 && i%10 == 0){
                batchArr.push(reviewQueue)
                reviewQueue = [];
            }
            // Creating queue of review
            reviewQueue.push(review)
        }
    })


    for(j=0;j<batchArr.length;j++){
        try{
            let reviewSummaryArr = await Promise.allSettled(batchArr[j].map(review=>review.method(review.reviewString,review.entityName)))
            if(Array.isArray(reviewSummaryArr) && reviewSummaryArr.length>0){
                reviewSummaryArr.forEach((re,k)=>{
                    if(re.status == "fulfilled"){
                            if('value' in re){
                                // if('err' in re.value && 'review' in re.value){
                                //     failedAnalysisArr.push(re.value)
                                // }else{
                                    insights[summarizedLength].summary = re.value
                                    summarizedLength++;
                                // }
                            }
                    }else if(re.status == "rejected"){
                        console.log(re)
                    }
                })
            }
            if(summarizedLength == reviewSummaryMethods.length)
            return insights;
        }catch(err){
            console.log(err)
        }        
    }    
}


const generateDescSummary = async(req,res,next)=>{

    let descArr = req.body.desc;
    let entityName = req.body.entityName;
    let reviewString = ''

    if(Array.isArray(descArr) && descArr.length>0){
        descArr.forEach((desc,j)=>{
            reviewString += `Review  ${j+1} - ${desc}`
        })
    }else{
        reviewString += `Review - ${descArr}`
    }
    let prompt = `Analyze the following reviews and generate a summary regarding what the customer is trying to express about ${entityName}.
    - Keep the analysis within 100 words.
    - The response should be a string
    ${reviewString}`

    try{
        let analysis = await openAi.generativeResponse(prompt)
        if(analysis){
            let responseObj = {
                data:analysis,
                code: 0,
                message:'Success'
            }
            res.send(responseObj)
        }
        else{
            let errMsg = 'Unable to generate summary'
            next(errMsg)
        }
    }catch(err){
        let errMsg = err
        next(errMsg) 
    }
}

module.exports = { fetchInsightAnalytics,generateDescSummary}