const joi = require('joi');
const genAi = require('../../utils/openai')

const generateReviewReply = async(req,res,next)=>{
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
    //    let prompt = `As a business representative suggest a suitable response for the following review. 
    //                 - The response should be empathetic and professional. 
    //                 - Also suggest a suitable compensation for this customer if the review has .${reviewObj.content}`
          let prompt = `Act like a customer satisfaction business representative in charge of social media presence.    
            - Your job is to go through the review comments and  draft a suitable response.    
            - Your response should not be more than 100 words strictly.   
            - Your response should be in an empathetic, spartan, conversational, yet professional tone.   
            - If you see any grievances, then feel free to suggest a suitable non-monetary compensation for the customer.   
            - Let the customer know that steps are being taken to avoid the same issues in future.
            - DO NOT respond with broken sentences or json.   
            - Respond with free-flowing text.
  
            Now with the above instructions generate a suitable response for the following paragraph
            ${reviewObj.content}`

       let reply = await genAi.generativeResponse(prompt)

       let response = {
            data: reply,
            code: 0,
            msg: 'Success'
        }

        res.send(response)
    }
}

module.exports = { generateReviewReply }