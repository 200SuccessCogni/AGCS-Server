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
        let prompt = `Suggest a suitable response for the following review. The response should be empathetic and professional. Also suggest a suitable compensation for this customer.${reviewObj.content}`

       let reply = await genAi.generativeResponse(prompt)

       let parsedReply = reply.data.choices[0].message.content 

       let response = {
            data: parsedReply,
            code: 0,
            msg: 'Success'
        }

        res.send(response)
    }
}

module.exports = { generateReviewReply }