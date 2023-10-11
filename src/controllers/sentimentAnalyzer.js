const nlp = require('../../src/controllers/nlp');

const sentimentAnalyze = async(req,res,next)=>{
    let sentimentAnalysis = await nlp.reviewSentiment(req.body.desc);

    res.send({
        data:{...sentimentAnalysis},
        msg:'Success'
    })
}

const entityAnalyze = async(req,res,next)=>{
    let entitySentiment = await nlp.entitySentiment(req.body.desc);

    res.send({
        data:entitySentiment,
        msg:'Success'
    })
}

module.exports = {sentimentAnalyze,entityAnalyze }