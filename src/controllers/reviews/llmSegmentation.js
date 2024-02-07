const cron = require('node-cron');
const locationModel = require('../../models/location')
const businessModel = require('../../models/business');
const reviewModel = require("../../models/review");
const entityModel = require("../../models/entitySentiment");
const joi = require('joi');
const fs = require("fs");
const kohlerPrompt = require('../llmAdapters/kohler');
const restaurantPrompt = require('../llmAdapters/restaurant');
const hotelPrompt = require('../llmAdapters/hotels');
const nlp = require('../../utils/nlp');
const openAi = require('../../utils/openai');

// Cron job to perform sentiment analysis every night
const dailyCronJob = cron.schedule('25 14 * * *',()=>{
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
                                theme:'',
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
    let url = './dummy/marriott.json'
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
        theme: joi.string().allow(''),
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
            theme: review.theme?review.theme:'',
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

    entitySentimentArr = hotelPrompt.entityMapping(locationReviews)
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

    let analysedObj = await hotelPrompt.hotelPrompt(review)
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
            analysis = await hotelPrompt.hotelPrompt(review)
            break;
        case 'KOHLER':
            analysis = await hotelPrompt.hotelPrompt(review);
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
