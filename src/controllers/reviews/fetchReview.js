const cron = require('node-cron');
const locationModel = require('../../models/location')
const businessModel = require('../../models/business');
const reviewModel = require("../../models/review");
const entityModel = require("../../models/entitySentiment");
const joi = require('joi');
const fs = require("fs");
const nlp = require('../../utils/nlp');
const openAi = require('../../utils/openai');


// Cron job to perform sentiment analysis every night
const dailyCronJob = cron.schedule('50 46 11 * * *',()=>{
    fetchLocations();
},{
    scheduled:true,
    timezone :'Asia/Kolkata'
})


// Fetch all locations from database. For now the application will support only local source. For fetching reviews from third party
// applications a source schema has to be created and that document will be used instead of the locations document to fetch reviews
const fetchLocations = async(req,res,next) =>{

    locationModel.find({})
            .populate({path:'businessId', model:businessModel})
            .then((doc)=>{
                if(doc){
                    // req.body = [...doc]
                    seggregateReviewCall(...doc)
                    // next()
                }else{
                    let timeStamp = Date.now();
                    let errMsg = `No locations found on ${timeStamp}`
                    next(errMsg)
                }
            })
            .catch((err)=>{
                if(err.path){
                    errMsg = err.path? err.path : 'Fetching locations'
                    next('Error in ' + errMsg)
                }else if(err.errors){
                    let message = err.toString().split(":");
                    let errMsg = message[2].split(",");
                    next(errMsg[0])
                }else{
                    next(err)
                }
            })
}



// For the time being we are consuming the services one after the other. Coomunication b/w services will be replaced by docker and Rabbitmq

// Method for identifying the review source and accordingly calling the next service
const seggregateReviewCall = async(...locations) =>{

    let allLocations = [...locations]

    // console.log(allLocations)

    let allLocationsSources = allLocations.map(loc=>{
        let locationObj = {}
        if(loc.source.toLowerCase() == "local"){
            locationObj = {
                locationName: loc.location,
                method:fetchReviews
            }
            return locationObj
        }else{
            locationObj = {
                locationName: loc.location,
                source: loc.source,
                url:loc.url,
                accountId:loc.accountId,
                locationId: loc.locationId,
                method:fetchThirdPartyReviews
            }
            return locationObj
        }
    })


    let cumulativeReviews = []
    let newReviewArray = []

    let reviewList = await Promise.allSettled(allLocationsSources.map(loc=>loc.method(loc.locationName))).then((res)=>{
        res.forEach((reviewArr,i)=>{

            // The response is an array object with status and value keys. If status is fullfilled then the response will have a value.
            // The number of objects is equal to the number of locations. The location index can be matched using the index of the response array. 

            if('value' in reviewArr && Array.isArray(reviewArr.value)){
                reviewArr.value.forEach((rev,j)=>{
                    let reviewObj = {
                        businessId:allLocations[i].businessId._id?allLocations[i].businessId._id:'',
                        locationId:allLocations[i]._id?allLocations[i]._id:'',
                        sourceReviewId:rev.sourceReviewId?rev.sourceReviewId:'',
                        rating:rev.rating?rev.rating:0,
                        title:rev.title?rev.title:'',
                        desc: rev.desc?rev.desc:'',
                        locationName: allLocations[i].locationName?allLocations[i].locationName:'',
                        city: allLocations[i].city?allLocations[i].city:'',
                        address:allLocations[i].address?allLocations[i].address:'',
                        state:allLocations[i].state?allLocations[i].state:'',
                        country:allLocations[i].country?allLocations[i].country:'',
                        source:allLocations[i].source?allLocations[i].source:'',
                        date:rev.date?rev.date:'',
                        upVote:rev.upVote?rev.upVote:'',
                        isSeen:false,
                        isActioned:false,
                        replyMessage:'',
                        sentimentScore:0,
                        sentimentMagnitude:0,
                        category:'',
                        cusName:rev.cusName?rev.cusName:'',
                        cusCity:rev.cusCity?rev.cusCity:'',
                        cusState:rev.cusState?rev.cusState:'',
                        cusCountry:rev.cusCountry?rev.cusCountry:'',
                        useNlp:allLocations[i].businessId.useNlp,
                        method:removeDuplicates
                    }
                    cumulativeReviews.push(reviewObj)
                })
            }
        })

        checkDuplicates(...cumulativeReviews) 
    }).catch(err=>{
        console.log('Err in fetching reviews')
    })
}


// Middleware for fetching reviews from dummy data
const fetchReviews = async(locationName) =>{
    console.log('Fetch started')
    let url = './dummy/business1.json'
    let jsonRes = [];

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
    console.log('Json read first')
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

const checkDuplicates = async(...cumulativeReview)=>{
    // console.log(cumulativeReview)
    let newReviewArr = [];
    let duplicateCheck = await Promise.all(cumulativeReview.map(review=> review.method(review))).then(res=>{
        res.forEach((review,i)=>{
            if(review == false){
                delete cumulativeReview[i].method
                newReviewArr.push(cumulativeReview[i])
            }
        })

        return newReviewArr
    }).then((reviewArr)=>{
        sentimentAnalysisSeggregator(reviewArr)
    })
}


const removeDuplicates = async(review)=>{
    let filter = {
        businessId: review.businessId?review.businessId:'',
        locationId : review.locationId?review.locationId:'',
        address: review.address?review.address:'',
        desc: review.desc? review.desc:'',
        date: review.date?review.date:''
    }

    let duplicateCheck;
    try{
        duplicateCheck = await reviewModel.find(filter)
                                .then(res=>{
                                    if(res.length>0){
                                        return true
                                    }else{
                                        return false
                                    }
                                })
    }catch(err){
        return false
    }
    
    return duplicateCheck

}

// Function to seggregate the sentiment analyser to be used
const sentimentAnalysisSeggregator = async(...reviews)=>{

    let allReview = reviews[0]

    let allReviewsAnalyzer = allReview.map(rev=>{
        // if(rev.useNlp == true){
            return {...rev,method: sentimentAnalyzer} 
        // }else{
            return {...rev,method: genAiAnalysis} 
        // }
    })

    let analyzedReviewsArr = []

    let analyzedReviews = await Promise.allSettled(allReviewsAnalyzer.map(rev=>rev.method(rev))).then((res)=>{
        res.forEach(re=>{
            if(re.status == "fulfilled"){
                analyzedReviewsArr.push(re.value)
            }
        })

        return analyzedReviewsArr
    }).then((...analyzedReviewsArr)=>{
        // Saving the reviews after sentiment analysis and categorization
        saveProcessedReview(...analyzedReviewsArr[0])
        // Performing entity sentiment analysis
        entitySentimentSeggregator(...analyzedReviewsArr[0])
    })
}

const entitySentimentSeggregator = async(...analyzedReviewsArr)=>{
    let entityAnalyzerArr = analyzedReviewsArr.map((review)=>{
        return {...review,method:entitySentimentAnalyzer}
    })


    let analyzedEntityArr = []

    let analyzedEntities = await Promise.allSettled(entityAnalyzerArr.map(rev=>rev.method(rev))).then((res)=>{
        res.forEach(re=>{
            if(re.status == "fulfilled"){
                analyzedEntityArr.push(re.value)
            }
        })
        return analyzedEntityArr
    }).then((...analyzedEntityArr)=>{
        saveEntities(...analyzedEntityArr[0])
    })
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
const sentimentAnalyzer = async(review)=>{

    let sentimentAnalysis =await nlp.reviewSentiment(review.desc);

    let score = sentimentAnalysis.documentSentiment.score? sentimentAnalysis.documentSentiment.score.toFixed(2): 0
    let magnitude = sentimentAnalysis.documentSentiment.magnitude? sentimentAnalysis.documentSentiment.magnitude.toFixed(2): 0
    review['isSeen'] = false,
    review['isActioned'] = categorizeActionItem(score,magnitude),
    review['replyMessage'] = '',
    review['sentimentScore'] = score,
    review['sentimentMagnitude'] = magnitude,
    review['category'] = categorizeSentiment(score,magnitude)
    delete review.method
    return review;
}

// Middleware for saving reviews with sentiment analysis. It expects an array of reviews
const saveProcessedReview = async(...reviews)=>{
    let reviewArr = [...reviews];
    // console.log(reviewArr)
    // return
    let filteredReviews = [];
    let reviewErrArr = [];

    const schema = joi.object({
        businessId: joi.string().hex().length(24).required(),
        locationId: joi.string().hex().length(24).required(),
        sourceReviewId: joi.string().allow(''),
        rating: joi.number().allow(''),
        title: joi.string().allow(''),
        desc: joi.string().required(),
        locationName: joi.string().required(),
        address: joi.string().required(),
        city: joi.string().allow(''),
        state: joi.string().allow(''),
        country: joi.string().allow(''),
        source: joi.string().required(),
        date: joi.string().required(),
        upVote: joi.number().allow(''),
        isSeen: joi.boolean().allow(''),
        isActioned: joi.boolean().allow(''),
        replyMessage: joi.string().allow(''),
        sentimentScore:joi.number().required(),
        sentimentMagnitude:joi.number().required(),
        category: joi.string().allow(''),
        cusName: joi.string().allow(''),
        cusCity: joi.string().allow(''),
        cusState: joi.string().allow(''),
        cusCountry: joi.string().allow(''),
        useNlp:joi.boolean().required()
    })

    reviewArr.forEach((review)=>{

        const reviewObj = {
            businessId: review.businessId?review.businessId.toString():'',
            locationId: review.locationId?review.locationId.toString():'',
            sourceReviewId: review.sourceReviewId ? review.sourceReviewId : '',
            rating: review.rating ? review.rating : '',
            title: review.title ? review.title : '',
            desc: review.desc ? review.desc : '',
            locationName: review.locationName ? review.locationName : '',
            address: review.address?review.address:'',
            city: review.city? review.city: '',
            state: review.state? review.state: '',
            country: review.country ? review.country : '',
            source: review.source? review.source.toLowerCase(): '',
            date: review.date ? review.date : '',
            upVote: review.upVote? review.upVote: 0,
            isSeen: review.isSeen,
            isActioned: review.isActioned, 
            replyMessage: review.replyMessage? review.replyMessage: '',
            sentimentScore: review.sentimentScore? review.sentimentScore: 0,
            sentimentMagnitude: review.sentimentMagnitude ? review.sentimentMagnitude : 0,
            sentimentScore: review.sentimentScore? review.sentimentScore: 0, 
            category: review.category? review.category: '',
            cusName: review.cusName? review.cusName: '',
            cusCity: review.cusCity ? review.cusCity : '',
            cusState: review.cusState ? review.cusState : '',
            cusCountry: review.cusCountry ? review.cusCountry : '',
            useNlp: review.useNlp
        }

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
        
        reviewModel.insertMany(filteredReviews,{ordered:false})
            .then((data) => {
                let response = {}
                console.log(data)
                if (Array.isArray(data) && data.length>0) {
                    console.log(`${data.length} reviews saved`)
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
                    console.log(response)
                }else {
                    next(err)
                }
            })
    }
}

//Middleware for sending the reviews for Entity Sentiment analysis in Google NLP
const entitySentimentAnalyzer = async(review)=>{

        let entitySentiment = await nlp.entitySentiment(review.desc);
        let entityObj = {
            businessId: review.businessId?review.businessId:'',
            locationId:review.locationId?review.locationId:'',
            desc:review.desc?review.desc:'',
            source: review.source?review.source:'',
            sourceReviewId: review.sourceReviewId?review.sourceReviewId:'',
            date: review.date?review.date:'',
            entities: [...entitySentiment.entities]
        }
        return entityObj
}

// Middleware for saving entitysentiment analysis. It expects an array of objects
const saveEntities = async(...entities)=>{

    let resortReviews =  [...entities];
    let entitySentimentArr = [];
    let entityErrArr = [];
    let entityArr = [];
    for(i=0;i<resortReviews.length;i++){

    let entityObjArr = [];

    let entityDetails = [...resortReviews[i].entities]

    entityDetails.forEach((entity)=>{
        // let sentence = entity.sentence? entity.sentence: '';
        let entityName = entity.name?entity.name.toLowerCase():'';
        let score = entity.sentiment.score?entity.sentiment.score:0;
        let magnitude = entity.sentiment.magnitude?entity.sentiment.magnitude:0; 
        const entityScore = {
            // sentence: sentence,
            entityName: entityName,
            sentimentScore:score,
            sentimentMagnitude: magnitude,
            category: categorizeSentiment(score,magnitude),
            actionItem: categorizeActionItem(score,magnitude),
            date: resortReviews[i].date?resortReviews[i].date:''
        }

        entityObjArr.push(entityScore)
    })

        let entityObj = {
            businessId: resortReviews[i].businessId?resortReviews[i].businessId.toString():'',
            locationId: resortReviews[i].locationId?resortReviews[i].locationId.toString():'',
            desc: resortReviews[i].desc?resortReviews[i].desc:'',
            source: resortReviews[i].source?resortReviews[i].source:'',
            sourceReviewId:resortReviews[i].sourceReviewId?resortReviews[i].sourceReviewId:'',
            entityScores: [...entityObjArr],
        }

        entitySentimentArr.push(entityObj)
    }

        const schema = joi.object({
            businessId: joi.string().required(),
            locationId: joi.string().required(),
            desc: joi.string().required(),
            source: joi.string().allow(''),
            sourceReviewId:joi.string().allow(''),
            entityScores:joi.array().items(joi.object({
                entityName: joi.string().required(),
                sentimentScore: joi.number().required(),
                sentimentMagnitude: joi.number().required(),
                category: joi.string().required(),
                actionItem: joi.boolean().required(),
                date: joi.string().required(''),
            })),
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
            entityModel.insertMany(entityArr,{ordered:false})
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
                    console.log(response)
                    // res.send(response)
                })
                .catch((err) => {
                    console.log('Entities err')
                    if (err.path) {
                        errMsg = err.path ? err.path : 'Creating entities'
                        console.log('Error in ' + errMsg)
                    } else if (err.errors) {
                        let message = err.toString().split(":");
                        let errMsg = message[2].split(",");
                        console.log(errMsg[0])
                    }else {
                        console.log(err)
                    }
                })
            }
}


// Method to perform gen ai based sentiment analysis
const genAiAnalysis= async(review)=> sentimentAnalysis = await openAi.generativeResponse(openAi)



module.exports = {dailyCronJob}
