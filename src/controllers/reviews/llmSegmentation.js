const cron = require('node-cron');
const locationModel = require('../../models/location')
const businessModel = require('../../models/business');
const reviewModel = require("../../models/review");
const entityModel = require("../../models/entitySentiment");
const joi = require('joi');
const fs = require("fs");
const kohlerPrompt = require('../llmAdapters/kohler');
const restaurantPrompt = require('../llmAdapters/restaurant');
const nlp = require('../../utils/nlp');
const openAi = require('../../utils/openai');

let llmAnalyzedResArr = [];

// Cron job to perform sentiment analysis every night
const dailyCronJob = cron.schedule('16 03 * * *',()=>{
    fetchAllBusiness();
},{
    scheduled:true,
    timezone :'Asia/Kolkata'
})


const fetchAllBusiness = async()=>{
    await businessModel.find({})
    .then((doc)=>{
        if(doc){
            fetchLocations(...doc)
        }else{
            let timeStamp = Date.now();
            let errMsg = `No locations found on ${timeStamp}`
            next(errMsg)
        }
    })
    .catch((err)=>{
        if(err.path){
            errMsg = err.path? err.path : 'Fetching locations'
        }else if(err.errors){
            let message = err.toString().split(":");
            let errMsg = message[2].split(",");
        }else{
            console.log(err)
        }
    })
}

// Fetch all locations from database. For now the application will support only local source. For fetching reviews from third party
// applications a source schema has to be created and that document will be used instead of the locations document to fetch reviews
const fetchLocations = async(...businesses) =>{

    let businessesIdArr = businesses.map(business=>business._id)
    let allLocations = [];
    let businessPopulatedLocations = [];
    try{
        allLocations = await locationModel.aggregate([{$match:{'businessId':{$in:businessesIdArr}}},]) 
    }catch(err){
        console.log('Error in fetching locations')
    }

    if(Array.isArray(allLocations) && allLocations.length>0){
        try{
            businessPopulatedLocations = await locationModel.populate(allLocations,{path:'businessId', model:businessModel})
        }catch(err){
            console.log('Error in fetching business')
        }            
    }


    if(Array.isArray(businessPopulatedLocations) && businessPopulatedLocations.length>0){
            seggregateReviewCall(...businessPopulatedLocations)        
    }
}

// For the time being we are consuming the services one after the other. Coomunication b/w services will be replaced by docker and Rabbitmq

// Method for identifying the review source and accordingly calling the next service
const seggregateReviewCall = async(...locations) =>{

    let allLocations = [...locations]

    let allLocationsSources = allLocations.map(loc=>{
        let locationObj = {}
        if(loc.source.toLowerCase() == "local"){
            locationObj = {
                locationName: loc.locationName,
                address: loc.address,
                method:fetchReviews
            }
            return locationObj
        }else{
            locationObj = {
                locationName: loc.locationName,
                address: loc.address,
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

    try{
        let reviewList = await Promise.allSettled(allLocationsSources.map(loc=>loc.method(loc.locationName)))
        
            if(Array.isArray(reviewList) && reviewList.length>0){
                allLocations.forEach((loc,i)=>{
                    let promiseObj = reviewList[i]
        
                    // The response is an array object with status and value keys. If status is fullfilled then the response will have a value.
                    // The number of objects is equal to the number of locations. The location index can be matched using the index of the response array. 
        
                    if('status' in promiseObj && promiseObj.status == "fulfilled" && 'value' in promiseObj && Array.isArray(promiseObj.value)){
        
                        let reviewsArr= [...promiseObj.value]
                        let locationReviews = reviewsArr.filter(rev=>rev.address ===loc.address )
        
                        locationReviews.forEach((rev,j)=>{
                            let reviewObj = {
                                businessId:loc.businessId._id?loc.businessId._id:'',
                                locationId:loc._id?loc._id:'',
                                sourceReviewId:rev.sourceReviewId?rev.sourceReviewId:'',
                                rating:rev.rating?rev.rating:0,
                                title:rev.title?rev.title:'',
                                desc: rev.desc?rev.desc:'',
                                desc_embedding : [],
                                locationName: loc.locationName?loc.locationName:'',
                                product: rev.product?rev.product:'',
                                city: loc.city?loc.city:'',
                                address:loc.address?loc.address:'',
                                state:loc.state?loc.state:'',
                                country:loc.country?loc.country:'',
                                source:loc.source?loc.source:'',
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
                                useNlp:loc.businessId.useNlp,
                                method:checkDuplicates
                            }
                            cumulativeReviews.push(reviewObj)
                        })
                    }
                })
        
                removeDuplicates(...cumulativeReviews) 
            }
    }catch(err){
        console.log('Err in fetching reviews')
    }
}


// Middleware for fetching reviews from dummy data
const fetchReviews = async(locationName) =>{
    console.log('Fetch started')
    let url = './dummy/kohler.json'
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
        try{
            const response = await fetch(url)
            const genTextResponse = await response.json();
            return res
        }catch(err){
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
        }
    }else{
        let errMsg = 'No url provided'
        next(errMsg)
    }
}

// Method to execute duplicacy check
const removeDuplicates = async(...cumulativeReview)=>{
    console.log('Duplicacy check initiated')
    let newReviewArr = [];
    try{
        let duplicateCheck = await Promise.all(cumulativeReview.map(review=> review.method(review)))
        if(Array.isArray(duplicateCheck) && duplicateCheck.length>0){
            duplicateCheck.forEach((review,i)=>{
                if(review == false){
                    delete cumulativeReview[i].method
                    newReviewArr.push(cumulativeReview[i])
                }
            })
        }
        console.log('Duplicacy check successful')
        sentimentAnalysisSeggregator(newReviewArr)
    }catch(err){
        console.log('Error conducting duplicacy check')
    }
}


const checkDuplicates = async(review)=>{
    
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

// Function to seggregate the sentiment analyser to be used and generate batches of review
const sentimentAnalysisSeggregator = async(...reviews)=>{

    let allReview = reviews[0]

    let allReviewsAnalyzer = allReview.map(rev=>{
        if(rev.useNlp == false){
            return {...rev,method: llmSentimentAnalyzer} 
        }
    })
    let batchArr = [];
    let reviewQueue = [];
    let llmAnalyzedReviewsArr = []
    let failedAnalysisArr = []

    allReviewsAnalyzer.forEach((review,i)=>{

        // Push the last queue of reviews into the batch array
        if(i == allReviewsAnalyzer.length -1){
            reviewQueue.push(review)            
            batchArr.push(reviewQueue)
        }else{
            // If index is divisible by 25, push queue to batch array and empty queue
            if(i!=0 && i%25 == 0){
                batchArr.push(reviewQueue)
                reviewQueue = [];
            }
            // Creating queue of review
            reviewQueue.push(review)
        }
    })




    for(j=0;j<batchArr.length;j++){
        try{
            let analyzedReviews = await Promise.allSettled(batchArr[j].map(rev=>rev.method(rev)))
            if(Array.isArray(analyzedReviews) && analyzedReviews.length>0){
                analyzedReviews.forEach(re=>{
                    if(re.status == "fulfilled"){
                            if('value' in re){
                                if('err' in re.value && 'review' in re.value){
                                    failedAnalysisArr.push(re.value)
                                }else{
                                    llmAnalyzedReviewsArr.push(re.value)
                                }
                            }
                    }else if(re.status == "rejected"){
                        console.log(re)
                    }
                })
            }
            if(failedAnalysisArr.length + llmAnalyzedReviewsArr.length == allReview.length){
                // Saving llm segmented reviews and entities
                saveLlmSegmentedReviews(...llmAnalyzedReviewsArr)
            }
        }catch(err){
            console.log('error in segmentation')
        }
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
            category = "Evaluate"
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


const saveLlmSegmentedReviews = async(...reviews)=>{
    let reviewArr = [...reviews];
    let filteredReviews = [];
    let reviewErrArr = [];

    const schema = joi.object({
        businessId: joi.string().hex().length(24).required(),
        locationId: joi.string().hex().length(24).required(),
        sourceReviewId: joi.string().allow(''),
        rating: joi.number().allow(''),
        title: joi.string().allow(''),
        desc: joi.string().required(),
        desc_embedding :joi.array().items({}),
        locationName: joi.string().required(),
        address: joi.string().required(),
        product: joi.string().allow(''),
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
            desc_embedding: [],
            locationName: review.locationName ? review.locationName : '',
            address: review.address?review.address:'',
            product: review.product?review.product:'',
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
        console.log(filteredReviews)
        try{
            let saveReviews = await reviewModel.insertMany(filteredReviews,{ordered:false})
            let response = {}
            console.log(saveReviews)
            if (Array.isArray(saveReviews) && saveReviews.length>0) {
                console.log(`${saveReviews.length} reviews saved`)
                saveLlmSegmentedEntities(...reviewArr)
            } else {
                let errMsg = 'No new reviews to add' 
                console.log(errMsg)
            }
        }catch(err){
            console.log('Reviews error' + err)
            if (err.path) {
                errMsg = err.path ? err.path : 'Creating processed review'
                console.log('Error in ' + errMsg)
            } else if (err.errors) {
                let message = err.toString().split(":");
                let errMsg = message[2].split(",");
                console.log(errMsg[0])
            }else if(err.code = '11000'){
                let response = {
                    data: '',
                    code: 0,
                    msg: `Success. Duplicate reviews have been removed.${err.result} records have been inserted`
                }
                saveLlmSegmentedEntities(...reviewArr)
                console.log(response)
            }else {
                console.log(err)
            }
        }
    }    
}
// Middleware for saving entitysentiment analysis. It expects an array of objects
const saveLlmSegmentedEntities = async (...reviews)=>{

    let locationReviews =  [...reviews];
    let entitySentimentArr = [];
    let entityErrArr = [];
    let entityArr = [];

    entitySentimentArr = kohlerPrompt.entityMapping(locationReviews)
    // for(i=0;i<locationReviews.length;i++){

    // let entityObjArr = [];
    // let entityDetails = [];    
    // // For ambience
    // if(Array.isArray(locationReviews[i].Ambience) && locationReviews[i].Ambience.length>0){
    //     let insightArr = [...locationReviews[i].Ambience]
    //     let insightScoreArr = locationReviews[i].Ambience_Sentiment_Score
    //     let insightMag = locationReviews[i].Ambience_Sentiment_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Ambience == "string" && locationReviews[i].Ambience && locationReviews[i].Ambience !="null" && locationReviews[i].Ambience.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Ambience,
    //         score: locationReviews[i].Ambience_Sentiment_Score
    //     }    
    //     entityDetails.push(insight)
    // }

    // // For beverages
    // if(Array.isArray(locationReviews[i].Beverages_Quality) && locationReviews[i].Beverages_Quality.length>0){
    //     let insightArr = [...locationReviews[i].Beverages_Quality]
    //     let insightScoreArr = locationReviews[i].Beverages_Quality_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Beverages_Quality == "string" && locationReviews[i].Beverages_Quality && locationReviews[i].Beverages_Quality !="null" && locationReviews[i].Beverages_Quality.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Beverages_Quality,
    //         score: locationReviews[i].Beverages_Quality_Score
    //     }    
    //     entityDetails.push(insight)
    // }

    // // For cleanliness
    // if(Array.isArray(locationReviews[i].Cleanliness) && locationReviews[i].Cleanliness.length>0){
    //     let insightArr = [...locationReviews[i].Cleanliness]
    //     let insightScoreArr = locationReviews[i].Cleanliness_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Cleanliness == "string" && locationReviews[i].Cleanliness && locationReviews[i].Cleanliness !="null" && locationReviews[i].Cleanliness.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Cleanliness,
    //         score: locationReviews[i].Cleanliness_Score
    //     }    
    //     entityDetails.push(insight)
    // }


    // // For food_items_dislikes
    // if(Array.isArray(locationReviews[i].Food_Items_Dislikes) && locationReviews[i].Food_Items_Dislikes.length>0){
    //     let insightArr = [...locationReviews[i].Food_Items_Dislikes]
    //     let insightScoreArr = locationReviews[i].Food_Items_Dislikes_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Food_Items_Dislikes == "string" && locationReviews[i].Food_Items_Dislikes && locationReviews[i].Food_Items_Dislikes !="null" && locationReviews[i].Food_Items_Dislikes.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Food_Items_Dislikes,
    //         score: locationReviews[i].Food_Items_Dislikes_Score
    //     }    
    //     entityDetails.push(insight)
    // }

    // // For food item likes
    // if(Array.isArray(locationReviews[i].Food_Items_Likes) && locationReviews[i].Food_Items_Likes.length>0){
    //     let insightArr = [...locationReviews[i].Food_Items_Likes]
    //     let insightScoreArr = locationReviews[i].Food_Items_Likes_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Food_Items_Likes == "string" && locationReviews[i].Food_Items_Likes && locationReviews[i].Food_Items_Likes !="null" && locationReviews[i].Food_Items_Likes.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Food_Items_Likes,
    //         score: locationReviews[i].Food_Items_Likes_Score
    //     }    
    //     entityDetails.push(insight)
    // }

    // // For food quality
    // if(Array.isArray(locationReviews[i].Food_Quality) && locationReviews[i].Food_Quality.length>0){
    //     let insightArr = [...locationReviews[i].Food_Quality]
    //     let insightScoreArr = locationReviews[i].Food_Quality_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Food_Quality == "string" && locationReviews[i].Food_Quality && locationReviews[i].Food_Quality !="null" && locationReviews[i].Food_Quality.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Food_Quality,
    //         score: locationReviews[i].Food_Quality_Score
    //     }    
    //     entityDetails.push(insight)
    // }    


    // // For portion size
    // if(Array.isArray(locationReviews[i].Portion_Size) && locationReviews[i].Portion_Size.length>0){
    //     let insightArr = [...locationReviews[i].Portion_Size]
    //     let insightScoreArr = locationReviews[i].Portion_Size_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Portion_Size == "string" && locationReviews[i].Portion_Size && locationReviews[i].Portion_Size !="null" && locationReviews[i].Portion_Size.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Portion_Size,
    //         score: locationReviews[i].Portion_Size_Score
    //     }    
    //     entityDetails.push(insight)
    // }

    // // For price
    // if(Array.isArray(locationReviews[i].Price) && locationReviews[i].Price.length>0){
    //     let insightArr = [...locationReviews[i].Price]
    //     let insightScoreArr = locationReviews[i].Price_Sentiment_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Price == "string" && locationReviews[i].Price && locationReviews[i].Price !="null" && locationReviews[i].Price.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Price,
    //         score: locationReviews[i].Price_Sentiment_Score
    //     }    
    //     entityDetails.push(insight)
    // }


    // // For recommendation
    // if(Array.isArray(locationReviews[i].Recommendation) && locationReviews[i].Recommendation.length>0){
    //     let insightArr = [...locationReviews[i].Recommendation]
    //     let insightScoreArr = locationReviews[i].Recommendation_Sentiment_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Recommendation == "string" && locationReviews[i].Recommendation && locationReviews[i].Recommendation !="null" && locationReviews[i].Recommendation.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Recommendation,
    //         score: locationReviews[i].Recommendation_Sentiment_Score
    //     }    
    //     entityDetails.push(insight)
    // }

    // // For return intent
    // if(Array.isArray(locationReviews[i].Return_Intent) && locationReviews[i].Return_Intent.length>0){
    //     let insightArr = [...locationReviews[i].Return_Intent]
    //     let insightScoreArr = locationReviews[i].Return_Intent_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Return_Intent == "string" && locationReviews[i].Return_Intent && locationReviews[i].Return_Intent !="null" && locationReviews[i].Return_Intent.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Return_Intent,
    //         score: locationReviews[i].Return_Intent_Score
    //     }    
    //     entityDetails.push(insight)
    // }

    // // For staff behavior
    // if(Array.isArray(locationReviews[i].Staff_Behavior) && locationReviews[i].Staff_Behavior.length>0){
    //     let insightArr = [...locationReviews[i].Staff_Behavior]
    //     let insightScoreArr = locationReviews[i].Staff_Behavior_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Staff_Behavior == "string" && locationReviews[i].Staff_Behavior && locationReviews[i].Staff_Behavior !="null" && locationReviews[i].Staff_Behavior.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Staff_Behavior,
    //         score: locationReviews[i].Staff_Behavior_Score
    //     }    
    //     entityDetails.push(insight)
    // }

    // // For taste descriptors
    // if(Array.isArray(locationReviews[i].Taste_Descriptors) && locationReviews[i].Taste_Descriptors.length>0){
    //     let insightArr = [...locationReviews[i].Taste_Descriptors]
    //     let insightScoreArr = locationReviews[i].Taste_Descriptor_Sentiment_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Taste_Descriptors == "string" && locationReviews[i].Taste_Descriptors && locationReviews[i].Taste_Descriptors !="null" && locationReviews[i].Taste_Descriptors.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Taste_Descriptors,
    //         score: locationReviews[i].Taste_Descriptor_Sentiment_Score
    //     }    
    //     entityDetails.push(insight)
    // }

    // // For wait time
    // if(Array.isArray(locationReviews[i].Wait_Time) && locationReviews[i].Wait_Time.length>0){
    //     let insightArr = [...locationReviews[i].Wait_Time]
    //     let insightScoreArr = locationReviews[i].Wait_Time_Sentiment_Score
    //     insightArr.forEach((ins,j)=>{
    //         if(typeof ins != "string")return;
    //         let insight = {
    //             entity:ins,
    //             score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
    //         }    
    //     entityDetails.push(insight)
    //     })
    // }else if(typeof locationReviews[i].Wait_Time == "string" && locationReviews[i].Wait_Time && locationReviews[i].Wait_Time !="null" && locationReviews[i].Wait_Time.toUpperCase() !="N/A"){
    //     let insight = {
    //         entity:locationReviews[i].Wait_Time,
    //         score: locationReviews[i].Wait_Time_Sentiment_Score
    //     }    
    //     entityDetails.push(insight)
    // }
    // // let entityDetails = [...locationReviews[i].entities]

    // console.log(entityDetails)

    // entityDetails.forEach((en)=>{
    //     // if(!en.entity ||!en.sentence )return;
    //     // let sentence = en.sentence? en.sentence: '';
    //     let entityName = en.entity?en.entity.toString():'';
    //     let score = en.score?en.score:0;
    //     let magnitude = en.magnitude?en.magnitude:0; 
    //     const entityScore = {
    //         sentence: "",
    //         entityName: entityName,
    //         sentimentScore:score,
    //         sentimentMagnitude: 0,
    //         category: categorizeSentiment(score,magnitude),
    //         actionItem: categorizeActionItem(score,magnitude),
    //         // category: "",
    //         // actionItem: "",
    //         date: locationReviews[i].date?locationReviews[i].date:''
    //     }

    //     entityObjArr.push(entityScore)
    // })

    //     let entityObj = {
    //         businessId: locationReviews[i].businessId?locationReviews[i].businessId.toString():'',
    //         locationId: locationReviews[i].locationId?locationReviews[i].locationId.toString():'',
    //         desc: locationReviews[i].desc?locationReviews[i].desc:'',
    //         source: locationReviews[i].source?locationReviews[i].source:'',
    //         sourceReviewId:locationReviews[i].sourceReviewId?locationReviews[i].sourceReviewId:'',
    //         entityScores: [...entityObjArr],
    //     }

    //     entitySentimentArr.push(entityObj)
    // }

        const schema = joi.object({
            businessId: joi.string().required(),
            locationId: joi.string().required(),
            desc: joi.string().required(),
            source: joi.string().allow(''),
            sourceReviewId:joi.string().allow(''),
            entityScores:joi.array().items(joi.object({
                sentence: joi.string().allow(''),
                entityName: joi.string().required(),
                sentimentScore: joi.number().required(),
                sentimentMagnitude: joi.number().allow(''),
                category: joi.string().allow(''),
                actionItem: joi.boolean().allow(''),
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
            await entityModel.insertMany(entityArr,{ordered:false})
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

const llmSentimentAnalyzer= async(review)=>{
    console.log('Segmentation initiated')
    // let prompt = `Perform entity sentiment analysis on each of the following sentence from the following review. 
    // - The analysis should have an entity and a score between -1 and 1. 
    // - The analysis should have a magnitude between 1 and 10. 
    // - Data type of score and magnitude should be float  
    // - Should not return Nan. Instead can return 0.
    // - Return an overall sentiment score and magnitude of the review with the same scale as mentioned. 
    // - Parse the response object in valid JSON format without assigning any key. 
    // - The JSON format should be ready to be used in a code. 
    // - The entities should be stacked inside a key named entities with the exact following key names - sentence, entity, score and magnitude.
    // - The data type of sentence and entity should be string and of score and magnitude should be float.
    // - In case of multiple entities in a single sentence, parse the entities in separate objects inside the entities key.
    // - The overall sentiment should be returned in another key field named overall_sentiment which should have two keys named score and magnitude.
    // - No explanation is required. - 
    // let prompt = `Perform entity sentiment analysis on each of the sentence from the following review. 
    // - The entities should be stacked inside an array object named entities with the exact following object key names - sentence, entity, score and magnitude.
    // - Score and magnitude should always return a numeric value and should not return Nan.
    // - Score can be between -1 and 1 and magnitude should be between 1 and 10.
    // - Return an overall sentiment score and magnitude of the review with the same scale as mentioned. 
    // - The overall sentiment should be returned in another object key named overall_sentiment which should have two keys named score and magnitude.
    // - Parse the response in valid JSON format. 
    // - The JSON format should be ready to be used in a code. 
    // - No explanation is required.
    // ${review.desc}`

    let analysedObj = await kohlerPrompt.kohlerPrompt(review)
    // switch (domain.toUpperCase()){
    //     case 'RESTAURANT':
    //         analysis = await restaurantPrompt.restaurantPrompt(review)
    //         break;
    //     case 'HOTEL':
    //         break;
    //     case 'KOHLER':
    //         analysis = await kohlerPrompt.kohlerPrompt(review);
    //         break;
    //     default:
    //         break;
    // }

    return analysedObj;

//     const SYSTEM = `You are an assistant designed to perform sentiment analysis and entity sentiment analysis 
//     on the text review.Perform aspect based sentiment analysis on the below customer review. \n    
//     Your sentimental analysis and entity sentiment should include the following details:\n    
//     Sentiment: The overall positive, negative or neutral sentiment expressed towards the restaurant/food. 
//     This indicates the satisfaction level of customers.  
//     \n    Sentiment score: Refers to a numerical score given to the sentiment of the review, usually ranging from -1 to +1.
//     \n    Sentiment magnitude: Refers to a numerical score given to the sentiment magnitude of the review, usually ranging from 1 to 10.
//     \n    Food quality: Specific aspects of the dining experience commented on like quality of solid foods like burger, pizza,donut etc. 
//     This information helps in identifying the strengths and weaknesses of the restaurant.
//     \n    Food quality score: Refers to the different food quality of the restaurant that were rated in the review usually ranging from -1 to +1.
//     \n   Taste descriptors: Refers to the specific flavors or tastes that are mentioned in the review sentence. 
//     Words used to describe how the food tasted like delicious, fresh, flavorful, bland etc. 
//     This provides feedback on dishes and helps in improving the quality of food.  \n    
//     Taste descriptor sentiment score: Refers to a numerical score given to the sentiment of the taste descriptors mentioned in the review sentence usually ranging from -1 to +1.  
//     \n    Portion size: Refers to the size of the portions of food served at the restaurant. 
//     If the portions are described as generous, adequate or small. This is a sign of value and helps customers in deciding what to order.  
//     \n    Portion size score: Refers to a numerical score given to the portion size mentioned in the review sentence usually ranging from -1 to +1.  
//     \n    Food items likes: Refers to the specific food items that the reviewer liked that are mentioned in the review sentence.  
//     \n    Food items likes score: Refers to a numerical score given to the food items liked mentioned in the review sentence usually ranging from -1 to +1. 
//     \n    Food items dislikes: Refers to the specific food items that the reviewer did not like that are mentioned in the review sentence.
//     \n    Food items dislikes score: Refers to a numerical score given to the food items disliked mentioned in the review sentence usually ranging from -1 to +1.  
//     \n    Wait time: Refers to the amount of time the reviewer had to wait for their food or for a table. 
//     Any comments on wait duration for table or food. This indicates capacity issues and helps in improving the efficiency of the restaurant.  
//     \n    Wait time sentiment score: Refers to a numerical score given to the sentiment of the wait time usually ranging from -1 to +1.  
//     \n    Staff behavior: Refers to the behavior of the staff at the restaurant. Feedback on staff interactions, friendliness, efficiency or rudeness. 
//     This is important for customer experience and helps in training staff. Do not consider any staff name or person name and also their designations.
//     \n    Staff behavior score: Refers to a numerical score given to the behavior of the staff mentioned in the review sentence usually ranging from -1 to +1.  
//     \n    Ambience: Refers to the atmosphere or insiance of the restaurant. Descriptions of decor, music, noise levels. 
//     This sets dining atmosphere expectations and helps in improving the overall dining experience.  
//     \n    Ambience sentiment score: Refers to a numerical score given to the sentiment of the insiance usually ranging from -1 to +1.  
//     \n    Price: Refers to the price of the food or drinks at the restaurant. Comments on whether prices were reasonable, expensive or a good value. 
//     This provides pricing insights and helps in setting competitive prices.  
//     \n    Price sentiment score: Refers to a numerical score given to the sentiment of the price usually ranging from -1 to +1.  
//     \n    Recommendation: Refers to whether or not the reviewer would recommend the restaurant to others. 
//     If the reviewer recommends or does not recommend the place. This is a strong indicator of satisfaction and helps in attracting new customers.  
//     \n    Recommendation sentiment score: Refers to a numerical score given to the sentiment of the recommendation usually ranging from -1 to +1.  
//     \n    Return intent: Refers to whether or not the reviewer intends to return to the restaurant in the future. Mention of return/repeat visits shows loyalty. This helps in retaining customers and building a loyal customer base.
//     \n    Return intent score: Refers to a numerical score given to the return intent usually ranging from -1 to +1.
//     \n    Beverages quality: Specific aspects of the dining experience commented on like quality of drinks like latte, shakes, espresso, tea etc. 
//     This information helps in identifying the strengths and weaknesses of the restaurant. 
//     \n    Beverages quality score: Refers to the different beverages quality like latte, shakes, espresso, tea etc of the restaurant that were rated in the review usually ranging from -1 to +1.
//     \n    Cleanliness: Referring to the cleanliness of the restaurant.
//     \n    Cleanliness score: Refers to a numerical score given to the cleanliness mentioned in the review sentence, usually ranging from -1 to +1.
//     \n    If no text is presented in any categories keep it [0] only. Focus only on entity keywords, do not provide sentences. 
//     \n - Response should strictly be in valid JSON specified in the output format. 
//     \n - The JSON format should be ready to be use in a code. 
//     \n - Only extract the entities which are present in the output format.`


// const USER = `${review.desc}`

// const ASSISTANT = `
// Your output response should contain the below details from the chat input.
// \n  Output Format:      
// \n        \"Sentiment\": [],\n        \"Sentiment_Score\": [],\n    \"Sentiment_Magnitude\": [],\n        \"Food_Quality\": [],
// \n        \"Food_Quality_Score\": [],\n        \"Taste_Descriptors\": [],\n        \"Taste_Descriptor_Sentiment_Score\": [],
// \n        \"Portion_Size\": [],\n        \"Portion_Size_Score\": [],\n        \"Food_Items_Likes\": [],
// \n        \"Food_Items_Likes_Score\": [],\n        \"Food_Items_Dislikes\": [],\n        \"Food_Items_Dislikes_Score\": [],
// \n        \"Wait_Time\": [],\n        \"Wait_Time_Sentiment_Score\": [],\n        \"Staff_Behavior\": [],
// \n        \"Staff_Behavior_Score\": [],\n        \"Ambience\": [],
// \n        \"Ambience_Sentiment_Score\": [],\n        \"Price\": [],\n        \"Price_Sentiment_Score\": [],
// \n        \"Recommendation\": [],\n        \"Recommendation_Sentiment_Score\": [],
// \n        \"Return_Intent\": [],\n        \"Return_Intent_Score\": [],\n        \"Beverages_Quality\": [],
// \n        \"Beverages_Quality_Score\": [],\n        \"Cleanliness\": [],\n        \"Cleanliness_Score\": []`

// const finalPrompt = `${SYSTEM} ${USER} ${ASSISTANT}`

//     try{
//         let analysis = await openAi.generativeResponse(finalPrompt)
//         console.log(analysis)
//         llmAnalyzedResArr.push(analysis);
//         let formattedResponse = await JSON.parse(analysis)
    
//         let score = formattedResponse.Sentiment_Score? parseFloat(formattedResponse.Sentiment_Score).toFixed(2): 0
//         let magnitude = formattedResponse.Sentiment_Magnitude? parseFloat(formattedResponse.Sentiment_Magnitude).toFixed(2): 0
//         review['isSeen'] = false,
//         review['isActioned'] = categorizeActionItem(score,magnitude),
//         review['replyMessage'] = '',
//         review['sentimentScore'] = score,
//         review['sentimentMagnitude'] = magnitude,
//         review['category'] = categorizeSentiment(score,magnitude),
//         review['Food_Quality'] = formattedResponse.Food_Quality,
//         review['Food_Quality_Score'] = formattedResponse.Food_Quality_Score,
//         review['Food_Quality_Magnitude'] = formattedResponse.Food_Quality_Magnitude,
//         review['Taste_Descriptors'] = formattedResponse.Taste_Descriptors,
//         review['Taste_Descriptor_Sentiment_Score'] = formattedResponse.Taste_Descriptor_Sentiment_Score,
//         review['Taste_Descriptors_Magnitude'] = formattedResponse.Taste_Descriptors_Magnitude,
//         review['Portion_Size'] = formattedResponse.Portion_Size,
//         review['Portion_Size_Score'] = formattedResponse.Portion_Size_Score,
//         review['Portion_Size_Magnitude'] = formattedResponse.Portion_Size_Magnitude,
//         review['Food_Items_Likes'] = formattedResponse.Food_Items_Likes,
//         review['Food_Items_Likes_Score'] = formattedResponse.Food_Items_Likes_Score,
//         review['Food_Items_Likes_Magnitude'] = formattedResponse.Food_Items_Likes_Magnitude,
//         review['Food_Items_Dislikes'] = formattedResponse.Food_Items_Dislikes,
//         review['Food_Items_Dislikes_Score'] = formattedResponse.Food_Items_Dislikes_Score,
//         review['Food_Items_Dislikes_Magnitude'] = formattedResponse.Food_Items_Dislikes_Magnitude,
//         review['Wait_Time'] = formattedResponse.Wait_Time,
//         review['Wait_Time_Sentiment_Score'] = formattedResponse.Wait_Time_Sentiment_Score,
//         review['Wait_Time_Magnitude'] = formattedResponse.Wait_Time_Magnitude,
//         review['Staff_Behavior'] = formattedResponse.Staff_Behavior,
//         review['Staff_Behavior_Score'] = formattedResponse.Staff_Behavior_Score,
//         review['Staff_Behavior_Magnitude'] = formattedResponse.Staff_Behavior_Magnitude,
//         review['Ambience'] = formattedResponse.Ambience,
//         review['Ambience_Sentiment_Score'] = formattedResponse.Ambience_Sentiment_Score,
//         review['Ambience_Magnitude'] = formattedResponse.Ambience_Magnitude,
//         review['Price'] = formattedResponse.Price,
//         review['Price_Sentiment_Score'] = formattedResponse.Price_Sentiment_Score,
//         review['Price_Magnitude'] = formattedResponse.Price_Magnitude,
//         review['Recommendation'] = formattedResponse.Recommendation_Sentiment_Score,
//         review['Recommendation_Sentiment_Score'] = formattedResponse.Recommendation_Sentiment_Score,
//         review['Recommendation_Magnitude'] = formattedResponse.Recommendation_Magnitude,
//         review['Return_Intent'] = formattedResponse.Return_Intent,
//         review['Return_Intent_Score'] = formattedResponse.Return_Intent_Score,
//         review['Return_Intent_Magnitude'] = formattedResponse.Return_Intent_Magnitude,
//         review['Beverages_Quality'] = formattedResponse.Beverages_Quality,
//         review['Beverages_Quality_Score'] = formattedResponse.Beverages_Quality_Score,
//         review['Beverages_Quality_Magnitude'] = formattedResponse.Beverages_Quality_Magnitude,
//         review['Cleanliness'] = formattedResponse.Cleanliness,
//         review['Cleanliness_Score'] = formattedResponse.Cleanliness_Score
//         review['Cleanliness_Magnitude'] = formattedResponse.Cleanliness_Magnitude,
//         delete review.method
        
//         return review
//     }catch(err){
//         let errObj = {
//             err: err,
//             review:review
//         }
//         return errObj
//     }
}


// Method to perform gen ai based sentiment analysis
const genAiAnalysis= async(req,res,next)=>{
    let domain = req.body.domain;
    let review = req.body.desc;
    let analysis = ``
    switch (domain.toUpperCase()){
        case 'RESTAURANT':
            analysis = await restaurantPrompt.restaurantPrompt(review)
            break;
        case 'HOTEL':
            break;
        case 'KOHLER':
            analysis = await kohlerPrompt.kohlerPrompt(review);
            break;
        default:
            break;
    }
    // let analysis = await openAi.generativeResponse(finalPrompt)
    // // let formattedResponse = JSON.parse(analysis.replace(/\n/g,''))
    // let formattedResponse = JSON.parse(analysis)
    res.send({
        data:analysis,
        msg:'Success'
    })
}

const genAiPlayground = async (prompt)=>{
    let analysis = await openAi.generativeResponse(prompt)
    let formattedResponse = JSON.parse(analysis)
    res.send({
        data:formattedResponse,
        msg:'Success'
    })
}

module.exports = {fetchAllBusiness,dailyCronJob,genAiAnalysis,genAiPlayground}
