const reviewModel = require("../../models/review");
const entityModel = require("../../models/entitySentiment");
const joi = require('joi');
const genAi = require('../../utils/openai')

const generateReviewRecommendation = async(req,res,next)=>{
    let reqPayload = req.body?req.body:''

    let reviewObj = {
        content: reqPayload.content?reqPayload.content:''
    }

    const schema = joi.object({
        content: joi.string().required()
    })

    // Check the format of each review
    let result = schema.validate(reviewObj)
    if (result.error) {
        let errMsg = 'Invalid content'
        next(errMsg)
    } else {
        let prompt = `Analyze the following reviews and generate a summary regarding what the customer is trying to express.
         - Generate the recommendations for improving services based on the review.
         - The recommendation is for internal use by business.
         - Your recommendation should not be more than 100 words strictly and should be made using bullet points and in new lines.   
         - Your recommendation should be in a conversational and professional tone.   
         - Respond with free-flowing text.
        ${reviewObj.content}`

       let recommendation = await genAi.generativeResponse(prompt)

       let response = {
            data: recommendation,
            code: 0,
            msg: 'Success'
        }

        res.send(response)
    }
}


const generateRecommendations = async(req,res,next)=>{
    let reqPayload = req.body?req.body:''

    let actionableItem = {
        businessId: req.businessId?new mongoose.Types.ObjectId(req.businessId):'',
        locationId: req.query.locationId?new mongoose.Types.ObjectId(req.query.locationId):'',
        category:{$in:['negative','review']},
        replyMessage : ""
    }

    let targetedReviews = [];
    
    // Actionable items
    await reviewModel.aggregate([
        {$match:actionableItem},
        {$project:{"category":1,"date":1,"title":1,"desc":1}}
    ]).exec().then((doc)=>{
        if(doc){
            targetedReviews = [...doc];
            res.send({
                data:targetedReviews,
                msg:'Success'
            })
        }
    }).catch((err)=>{
        errMsg = 'Error in fetching review'
        next(errMsg)
    });

    // let reviewObj = {
    //     content: reqPayload.content?reqPayload.content:''
    // }

    // const schema = joi.object({
    //     content: joi.string().required()
    // })

    // // Check the format of each review
    // let result = schema.validate(reviewObj)
    // if (result.error) {
    //     let errMsg = 'Invalid content'
    //     next(errMsg)
    // } else {
    //     let prompt = `Suggest recommendations to improve the services of the hotel based on the following review. The recommendation should be from an experts point of view.${reviewObj.content}`

    //    let recommendation = await genAi.generativeResponse(prompt)

    //    let parsedRecommendation = recommendation.data.choices[0].message.content 

    //    console.log(parsedRecommendation)

    //    let response = {
    //         data: parsedRecommendation,
    //         code: 0,
    //         msg: 'Success'
    //     }

    //     res.send(response)
    // }
}

module.exports = { generateReviewRecommendation,generateRecommendations }