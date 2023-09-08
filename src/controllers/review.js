const Review = require("../models/review");
// const CronJob = require('cron').CronJob;
const reviewSource = require('../models/reviewSources');
const entityDetails = require('../models/entityReport');
const joi = require('joi');
const fs = require("fs");
const nlp = require('../../src/controllers/nlp');
const mongoose = require('mongoose');
const genAi = require('./openai');
const ObjectId = mongoose.Types.ObjectId;
const axios = require('axios');



// Add review sources
const addReviewSources = async(req,res,next) =>{
    let sources = [];
    let sourcesObj = {
        userId: req.userId?req.userId.toString():'',
        resortId: req.query.resortId?req.query.resortId.toString():'',
        sources : []
    }

    if(Array.isArray(req.body.sources) && req.body.sources.length>0){
        sources = [...req.body.sources]
        sources.forEach((source)=>{
            let sourceArrObj = {
                name: source.name?source.name:'',
                url : source.url?source.url:'',
                headers: source.headers? source.headers: '',
                queryParams: source.queryParams?source.queryParams:'',
                payload: source.payload? source.payload:'',
                partnerKey: source.partnerKey? source.partnerKey:'',
                userName: source.userName?source.userName:'',
                password: source.password?source.password:''
            }
            sourcesObj.sources.push(sourceArrObj);
        })

        const schema = joi.object({
            userId: joi.string().required(),
            resortId: joi.string().required(),
            sources : joi.array().items(joi.object({
                name: joi.string().required(),
                url: joi.string().allow(''),
                headers: joi.string().allow(''),
                queryParams: joi.string().allow(''),
                payload: joi.string().allow(''),
                partnerKey: joi.string().allow(''),
                userName: joi.string().allow(''),
                password: joi.string().allow('')
            }))
        })

        let result = schema.validate(sourcesObj)

        if(result.error){
            let errMsg = 'Invalid request'
            next(errMsg)
        }else{
            reviewSource.create(sourcesObj)
            .then((doc)=>{
                if(!doc){
                    let errMsg = "No new sources"
                    console.log(errMsg)
                }
                // req.body = doc;
                next()
            })
            .catch((err)=>{
                if(err.path){
                    errMsg = err.path? err.path : 'Saving source data'
                    next('Error in ' + errMsg)
                }else if(err.errors){
                    let message = err.toString().split(":");
                    let errMsg = message[2].split(",");
                    next(errMsg[0])
                }else if(err.code = '11000'){
                    console.log('Duplicate review sources removed')
                    next();
                }else{
                    next(err)
                }
            })
        }
    }else{
        let errMsg = 'No sources received';
        next(errMsg);
    }
}


// Middleware to call http method or dummy data based on the source
const fetchSourceSeggregator = async(req,res,next)=>{
    let sources = [];
    let funcArr = [];
    let reviewsArray = [];
    let response = '';
    if(Array.isArray(req.body.sources) && req.body.sources.length>0){
        sources = [...req.body.sources]
    }


    sources.forEach((source)=>{
        if(source.name == "demodata" || "demo"){
            funcArr.push({
                obj : {
                    userId:req.userId?req.userId:'',
                    resortId:req.query.resortId?req.query.resortId:''
                },
                method:fetchReviews
            }) 
        }else{
            funcArr.push({
                obj: source,
                method:fetchThirdPartyReviews
            }) 
        }
    })


    sourcesReviews= await Promise.all(funcArr.map((fn)=>{return fn.method(fn.obj)}))
    .then((data)=>{
        let reviews = [...data[0]]
        req.body = reviews;
        next();
    }).catch((err)=>{
        let errMsg = 'Error fetching data'
        next(errMsg);
    })
    console.log('Flow continued')
}




// // This will fetch reviews from third party urls every 2 mins
// const fetchReviewScheduler = (req,res,next)=>{
//     const job = new CronJob('0 */2 * * * *', function() {
//         console.log('Node Cron Executed')
//         next();
//     });

//     if(req.userId){
//         console.log('Node Cron Job start')
//         job.start();
//     }else{
//         console.log('Node Cron Job stop')
//         job.stop();
//     }
    
// }


// Middleware for fetching reviews from dummy data
const fetchReviews = async(sources) =>{
    console.log('Fetch started')
    let url = ''
    let jsonRes = [];
    console.log(sources)
    let params = sources

    if(params.userId == "649bf0f508c96b1fae7f215f"){
        if(params.resortId == "649da34e953f4d5cdeaff1bb"){
            url = './dummy/resort1.json' 
        }else if(params.resortId == "649da3f7953f4d5cdeaff1c1"){
            url = './dummy/resort2.json'
        }
    }else if(params.userId == "649bf150ca8ccd19b148bb53"){
        if(params.resortId == "649da42b953f4d5cdeaff1c7"){
            url = './dummy/hotel2.json'
        }
    }else if(params.userId == "649bf175ca8ccd19b148bb66"){
        if(params.resortId == "64a2eac7e4102f057b23ec1b"){
            url = './dummy/hotel3.json'
        }
    }

    console.log(url)

    let readFile = new Promise((resolve,reject)=>{
        fs.readFile(url, "utf8", (err, jsonString) => {
            if (err) {
                next("File read failed:", err);
                reject();
            }
            console.log('Json read')
            jsonRes = [...JSON.parse(jsonString)];
            resolve(jsonRes)
        });
    })
    return readFile;
}


// Function for fetching reviews from third party websites
const fetchThirdPartyReviews = async(info)=>{
    let url = `https://jsonplaceholder.typicode.com/posts/1`;
    let queryParam = info.queryParam?info.queryParam:'';
    let headers = info.headers?{...info.headers}:'';
    let payload = info.payloads?{...info.payloads}:''

    if(url){
        axios.get(url)  
        // Show response data
        .then((res) => {
            return res
        })
        .catch((err) =>{
            if(err.path){
                errMsg = err.path? err.path : `fetching ${info.name} reviews`
                next('Error in ' + errMsg)
            }else if(err.errors){
                let message = err.toString().split(":");
                let errMsg = message[2].split(",");
                next(errMsg[0])
            }else{
                next(err)
            }
        })
    }else{
        let errMsg = 'No url provided'
        next(errMsg)
    }
}

// Functions to categorize sentiment and entity sentiment
const categorizeSentiment = (score,magnitude)=>{
    let category = 'Neutral'
    let scoreFloat = parseFloat(score).toFixed(2);
    let magnitudeFloat = parseFloat(magnitude).toFixed(2);

    if(scoreFloat >= 0.2){
        category = 'Positive'
    }else if(scoreFloat < 0){
        category = 'Negative'
    }else{
        if(magnitudeFloat > 2){
            category = "Review"
        }else{
            category = 'Neutral'
        }
    }
    
    return category.toLowerCase();

}

const categorizeActionItem = (score,magnitude) =>{
    let isActioned = false
    let scoreFloat = parseFloat(score).toFixed(2);
    let magnitudeFloat = parseFloat(magnitude).toFixed(2);

    if(scoreFloat >= 0.2){
        isActioned = false
    }else if(scoreFloat < 0){
        isActioned = true
    }else{
        if(magnitudeFloat > 2){
            isActioned = true
        }else{
            isActioned = false
        }
    }
    
    return isActioned;
}

//Middleware for sending the reviews for Sentiment analysis in Google NLP
const sentimentAnalysis = async(req,res,next)=>{

    let reviewArr= []
    let processedReviewArr = [];

    if(Array.isArray(req.body) && req.body.length>0){
        // Since mongodb documents are bson, we need to convert it to json before modifying them
        let jsonReviewArr = JSON.stringify(req.body)
        reviewArr = JSON.parse(jsonReviewArr);
        for(i=0;i<reviewArr.length;i++){
            try{
                // Send review description for Sentiment analysis
                let sentimentAnalysis = await nlp.reviewSentiment(reviewArr[i].desc);

                let score = sentimentAnalysis.documentSentiment.score? sentimentAnalysis.documentSentiment.score.toFixed(2): 0
                let magnitude = sentimentAnalysis.documentSentiment.magnitude? sentimentAnalysis.documentSentiment.magnitude.toFixed(2): 0
                    const additionalFields ={
                        isSeen : false,
                        isActioned : categorizeActionItem(score,magnitude),
                        replyMessage : '',
                        sentimentScore: score,
                        sentimentMagnitude: magnitude,
                        category: categorizeSentiment(score,magnitude)
                    }                

                    delete reviewArr[i]._id
                    delete reviewArr[i].__v
                    delete reviewArr[i].createdAt
                    delete reviewArr[i].updatedAt
                    
                    const reviewObj = {...reviewArr[i],...additionalFields}

                    processedReviewArr.push(reviewObj);
            }catch(err){
                let errMsg ='Error in sentiment analysis'
                console.log(err)
                next(errMsg)
            }
        }

        if(processedReviewArr.length == reviewArr.length){
            req.body = [...processedReviewArr];
            next();
        }else{
            let errMsg ='Error in sentiment analysis'
            next(errMsg)
        }
    }
}

// Middleware for saving reviews with sentiment analysis
const saveProcessedReview = async(req,res,next)=>{
    let reviewArr = [...req.body];
    let filteredReviews = [];
    let reviewErrArr = [];

    const schema = joi.object({
        userId: joi.string().hex().length(24).required(),
        resortId: joi.string().hex().length(24).required(),
        resortName: joi.string().required(),
        city: joi.string().required(),
        state: joi.string().allow(''),
        country: joi.string().required(),
        title: joi.string().required(),
        desc: joi.string().required(),
        cusName: joi.string().allow(''),
        cusCity: joi.string().allow(''),
        cusState: joi.string().allow(''),
        cusCountry: joi.string().allow(''),
        source: joi.string().required().allow(''),
        rating: joi.number().allow(0),
        upVote: joi.number().allow(0),
        isSeen: joi.boolean().required(),
        isActioned: joi.boolean().required(),
        replyMessage: joi.string().allow(''),
        sentimentScore: joi.number().required(),
        sentimentMagnitude: joi.number().required(),
        category: joi.string().required(),
        date: joi.string().required(),
    })

    reviewArr.forEach((review)=>{

        const reviewObj = {
            userId: req.userId?req.userId.toString():'',
            resortId: req.query.resortId?req.query.resortId.toString():'',
            resortName: review.resortName ? review.resortName : '',
            city: review.city ? review.city : '',
            state: review.state ? review.state : '',
            country: review.country ? review.country : '',
            title: review.title ? review.title : '',
            desc: review.desc? review.desc: '',
            cusName: review.cusName? review.cusName: '',
            cusCity: review.cusCity ? review.cusCity : '',
            cusState: review.cusState? review.cusState: '',
            cusCountry: review.cusCountry ? review.cusCountry : '',
            source: review.source? review.source.toLowerCase(): '',
            rating: review.rating ? review.rating : 0,
            upVote: review.upVote? review.upVote: 0, 
            isSeen: review.isSeen? review.isSeen: false,
            isActioned: review.isActioned? review.isActioned: false,
            replyMessage: review.replyMessage ? review.replyMessage : '',
            sentimentScore: review.sentimentScore? review.sentimentScore: 0, 
            sentimentMagnitude: review.sentimentMagnitude? review.sentimentMagnitude: 0,
            category: review.category? review.category: '',
            date: review.date ? review.date : '',
        }

        console.log(reviewObj)

        // Check the format of each review
        let result = schema.validate(reviewObj)
        if (result.error) {
            console.log(result.error);
            reviewErrArr.push(reviewObj);
        } else {
            filteredReviews.push(reviewObj);
        }
    })

    if (filteredReviews.length>0) {

        // Create review document fetched from third party api
        
        Review.insertMany(filteredReviews,{ordered:false})
            .then((data) => {
                let response = {}
                console.log(data)
                if (Array.isArray(data) && data.length>0) {
                    console.log('Reviews saved')
                    // response = {
                    //     data: '',
                    //     code: 0,
                    //     msg: 'Success'
                    // }
                    req.body = [...data]
                    next();
                } else {
                    let errMsg = 'No new reviews to add' 
                    next(errMsg)
                }
            })
            .catch((err) => {
                console.log('Reviews error')
                if (err.path) {
                    errMsg = err.path ? err.path : 'Creating processed review'
                    next('Error in ' + errMsg)
                } else if (err.errors) {
                    let message = err.toString().split(":");
                    let errMsg = message[2].split(",");
                    next(errMsg[0])
                }else if(err.code = '11000'){
                    let response = {
                        data: '',
                        code: 0,
                        msg: `Success. Duplicate reviews have been removed.${err.result.insertedCount} records have been inserted`
                    }
                    res.send(response)
                }else {
                    next(err)
                }
            })
    }
}


const fetchEntityAnalysis = async(req,res,next)=>{

    let resortReviews =  [...req.body];
    let entitySentimentArr = [];
    let entityErrArr = [];
    let entityArr = [];
    for(i=0;i<resortReviews.length;i++){
        let entitySentiment = await nlp.entitySentiment(resortReviews[i].desc);

        let entities = [...entitySentiment.entities]

        let recommendations = [];

        let entityObjArr = [];

        entities.forEach((entity)=>{
            let sentence = entity.sentence? entity.sentence: '';
            let entityName = entity.name?entity.name.toLowerCase():'';
            let score = entity.sentiment.score?entity.sentiment.score:0;
            let magnitude = entity.sentiment.magnitude?entity.sentiment.magnitude:0; 
            const entityScore = {
                sentence: sentence,
                entityName: entityName,
                sentimentScore:score,
                sentimentMagnitude: magnitude,
                category: categorizeSentiment(score,magnitude),
                actionItem: categorizeActionItem(score,magnitude)
            }

            entityObjArr.push(entityScore)
        })

        let entityObj = {
            userId: req.userId?req.userId.toString():'',
            resortId: req.query.resortId?req.query.resortId.toString():'',
            reviewId: resortReviews[i]._id?resortReviews[i]._id.toString():'',
            source: resortReviews[i].source?resortReviews[i].source:'',
            entityScores: [...entityObjArr],
            date: resortReviews[i].date?resortReviews[i].date:''
        }

        entitySentimentArr.push(entityObj)
    }

    const schema = joi.object({
        userId: joi.string().required(),
        resortId: joi.string().required(),
        reviewId: joi.string().required(),
        source: joi.string().allow(''),
        entityScores:joi.array().items(joi.object({
            entityName: joi.string().required(),
            sentimentScore: joi.number().required(),
            sentimentMagnitude: joi.number().required(),
            category: joi.string().required(),
            actionItem: joi.boolean().required()
        })),
        date: joi.string().allow(''),
    })

    entitySentimentArr.forEach((entity)=>{
        // Check the format of each review
        let result = schema.validate(entity)
        if (result.error) {
            console.log(result.error)
            entityErrArr.push(entity);
        } else {
            entityArr.push(entity);
        }
    })


    if (entityArr.length>0) {

        // Create entity document for each review       
        console.log(entityArr)
        entityDetails.insertMany(entityArr,{ordered:false})
            .then((data) => {
                let response = {}
                console.log(data)
                if (Array.isArray(data) && data.length>0) {
                    response = {
                        data: '',
                        code: 0,
                        msg: 'Reviews,sentiments and entities saved'
                    }
                } else {
                    response = {
                        data: data,
                        code: 1,
                        msg: 'No new entities to add'
                    }
                }
                console.log('response')
                res.send(response)
            })
            .catch((err) => {
                console.log('Entities err')
                if (err.path) {
                    errMsg = err.path ? err.path : 'Creating entities'
                    next('Error in ' + errMsg)
                } else if (err.errors) {
                    let message = err.toString().split(":");
                    let errMsg = message[2].split(",");
                    next(errMsg[0])
                }else {
                    next(err)
                }
            })
    }
}


// Middleware to get all saved reviews also filter the reviews
const getReviews = async (req,res,next) => {

        let startDate = req.query.startDate?req.query.startDate:'';
        let endDate = req.query.endDate?req.query.endDate:'';
        let source = req.query.source?req.query.source.split(','):'';
        let category = req.query.category?req.query.category:'';
        let rating = req.query.rating? req.query.rating:''
        console.log(category)

        let filter = {
            userId: req.userId?new mongoose.Types.ObjectId(req.userId):'',
            resortId: req.query.resortId?new mongoose.Types.ObjectId(req.query.resortId):'',
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
            filter.category = category
        }

        // Rating Filtering
        if(rating){
            filter.rating = parseInt(rating)
        }

        console.log(filter);
        Review.aggregate([
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


// Middleware to fetch review stats
const fetchReviewStats = async(req,res,next)=>{

    let startDate = req.query.startDate?req.query.startDate:'';
    let endDate = req.query.endDate?req.query.endDate:'';
    let source = req.query.source?req.query.source.split(','):'';
    let category = req.query.category?req.query.category:'';
    let rating = req.query.rating? req.query.rating:''
    console.log(category)

    let filter = {
        userId: req.userId?new mongoose.Types.ObjectId(req.userId):'',
        resortId: req.query.resortId?new mongoose.Types.ObjectId(req.query.resortId):'',
    }

    console.log(filter);

    let responseObj = {
        categories : {},
        sources: {},
        insights: [],
        analytics: [],
        actionReviews : [],
        actionableAmeneties: []
    }

    // Review category count
    await Review.aggregate([
        {$match:filter},
        {$group:{_id:'$category',count:{$sum:1}}}
    ]).exec().then((doc)=>{
        if(doc){
            responseObj.categories = {...doc};
        }
    }).catch((err)=>{
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // Review source count
    await Review.aggregate([
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

    // Review analytics i.e average score of the entities
    // Mongodb group function used
    let insightParams =  ['parking','wellness','housekeeping','spa','bathroom','bedroom','room','kitchen','food','bar','restaurant','pool','breakfast','gym','toilet','shower','bed']
    await entityDetails.aggregate([
        {$match:filter},
        {$unwind: '$entityScores'},
        {$group:{
            _id:'$entityScores.entityName',
            count:{$sum:1},
            avgScore:{$avg:'$entityScores.sentimentScore'},
            avgMagnitude:{$avg:'$entityScores.sentimentMagnitude'}
        }},
        {$match:{_id:{$in:insightParams}}}
    ]).exec().then((doc)=>{
        if(doc){
            responseObj.analytics = [...doc];
        }
    }).catch((err)=>{
        console.log(err)
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // Review insights i.e. persisting entity scores
    // Mongodb window function
    await entityDetails.aggregate([
        {$match:filter},
        {$unwind: '$entityScores'},
        {$match:{'entityScores.entityName':{$in:insightParams}}},
        {$setWindowFields:{
            partitionBy:'$entityScores.entityName',
            sortBy: {'entityScores.sentimentScore':1},
            output:{
                "avgScore":{
                    $avg:"$entityScores.sentimentScore"
                }
            }
        }},
        {$project:{"date":1,"entityScores":1}}
    ]).exec().then((doc)=>{
        if(doc){
            responseObj.insights = [...doc];
            // res.send(responseObj)
        }
    }).catch((err)=>{
        console.log(err)
        errMsg = 'Error in fetching review'
        next(errMsg)
    });


    let actionableItem = {
        userId: req.userId?new mongoose.Types.ObjectId(req.userId):'',
        resortId: req.query.resortId?new mongoose.Types.ObjectId(req.query.resortId):'',
        category:{$in:['negative','review']},
        replyMessage : ""
    }

    // Actionable items
    await Review.aggregate([
        {$match:actionableItem},
        {$project:{"category":1,"date":1,"title":1,"desc":1}}
    ]).exec().then((doc)=>{
        if(doc){
            responseObj.actionReviews = [...doc];
        }
    }).catch((err)=>{
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // Mongodb window function
    await entityDetails.aggregate([
        {$match:filter},
        {$unwind: '$entityScores'},
        {$match:{'entityScores.entityName':{$in:insightParams},'entityScores.category':{$in:['negative','review']}}},
        {$lookup:{
            from: "REVIEW",
            localField: "reviewId",
            foreignField: "_id",
            as: "review",
        }},
        {$unwind:'$review'},
        {$project:{'reviewId':1,'entityScores.entityName':1,'entityScores.sentimentScore':1,'entityScores.sentimentMagnitude':1,'entityScores.category':1,
                    'source':1,'date':1, 'review.desc':1}}
    ]).exec().then((doc)=>{
        if(doc){

            console.log(doc);

            doc.forEach((insight)=>{
                const actionObj = {
                    actionText : `${insight.entityScores.entityName} has recieved a ${insight.entityScores.category} feedback on ${insight.date} from ${insight.source}`,
                    reviewText : insight.review.desc,
                    source: insight.source,

                }
                responseObj.actionableAmeneties.push(actionObj)
            })
            res.send(responseObj)
        }
    }).catch((err)=>{
        console.log(err)
        errMsg = 'Error in fetching review'
        next(errMsg)
    });
}

const fetchRecommendations = async(req,res,next)=>{
    let filter = {
        userId: req.userId?new mongoose.Types.ObjectId(req.userId):'',
        resortId: req.query.resortId?new mongoose.Types.ObjectId(req.query.resortId):'',
    }

    let actionableItem = {
        userId: req.userId?new mongoose.Types.ObjectId(req.userId):'',
        resortId: req.query.resortId?new mongoose.Types.ObjectId(req.query.resortId):'',
        category:{$in:['negative','review']},
        replyMessage : ""
    }

    let insightParams =  ['parking','wellness','housekeeping','spa','bathroom','bedroom','room','kitchen','food','bar','restaurant','pool','breakfast','gym','toilet','shower','bed']

    // Actionable items
    await Review.aggregate([
        {$match:actionableItem},
        {$project:{"category":1,"date":1,"title":1,"desc":1}}
    ]).exec().then((doc)=>{
        if(doc){
            responseObj.actionReviews = [...doc];
        }
    }).catch((err)=>{
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // Mongodb window function
    await entityDetails.aggregate([
        {$match:filter},
        {$unwind: '$entityScores'},
        {$match:{'entityScores.entityName':{$in:insightParams},'entityScores.category':{$in:['negative','review']}}},
        {$lookup:{
            from: "REVIEW",
            localField: "reviewId",
            foreignField: "_id",
            as: "review",
        }},
        {$unwind:'$review'},
        {$project:{'reviewId':1,'entityScores.entityName':1,'entityScores.sentimentScore':1,'entityScores.sentimentMagnitude':1,'entityScores.category':1,
                    'source':1,'date':1, 'review.desc':1}}
    ]).exec().then((doc)=>{
        if(doc){

            console.log(doc);

            doc.forEach((insight)=>{
                const actionObj = {
                    actionText : `${insight.entityScores.entityName} has recieved a ${insight.entityScores.category} feedback on ${insight.date} from ${insight.source}`,
                    sentence : insight.entityScores.sentence,
                    reviewText : insight.review.desc,
                    source: insight.source,

                }
                responseObj.actionableAmeneties.push(actionObj)
            })
            res.send(responseObj)
        }
    }).catch((err)=>{
        console.log(err)
        errMsg = 'Error in fetching review'
        next(errMsg)
    });
}


const updateReviewById = async (req, res, next) => {

    let filter = {_id: req.query.reviewId}

    let reviewUpdateObj = {
        $set:{
            isSeen:req.body.isSeen?req.body.isSeen:false,
            replyMessage:req.body.replyMessage?req.body.replyMessage:''
        }
    }

    let options = {
        new:true,
    }

    Review.findOneAndUpdate(filter,reviewUpdateObj,options)
    .then((review)=>{
        if(review){
            let response = {
                doc: review,
                code: 0,
                msg: 'Success'
            }
            res.send(response)
        }else{
            let errMsg = 'Unable to update review';
            next(errMsg)
        }
    })
    .catch((err)=>{
        if (err.path) {
            errMsg = err.path ? err.path : 'Updating review'
            next('Error in ' + errMsg)
        } else if (err.errors) {
            let message = err.toString().split(":");
            let errMsg = message[2].split(",");
            next(errMsg[0])
        }else {
            next(err)
        }
    })
};


const entityAnalysis = async(req,res,next)=>{
    let entitySentiment = await nlp.entitySentiment(req.body.desc)
    res.send(entitySentiment)    
}

const recommendation = async(req,res,next)=>{
    let prompt = `Suggest proper actions for the following review - ${req.body.prompt}`
    // try {
        const response =await genAi.generativeResponse(prompt)
        //   engine: 'text-davinci-002',
        //   prompt: prompt,
        //   max_tokens: 50,
        //   n: 1,
        //   stop: null,
        //   temperature: 0.5,
        // });
    
        res.json(response);
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: 'An error occurred while processing your request.' });
    //   }
}

module.exports = {addReviewSources,fetchSourceSeggregator, fetchReviews, sentimentAnalysis, saveProcessedReview, fetchEntityAnalysis, 
                    fetchReviewStats,fetchRecommendations, updateReviewById, getReviews,entityAnalysis,recommendation }