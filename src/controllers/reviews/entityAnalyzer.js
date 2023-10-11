const reviewModel = require("../../models/review");
const fs = require("fs");
const nlp = require('../../utils/nlp');

const performEntity = async (req,res,next)=>{
    let reviews = await fetchReviews()

    let allReviews = [...reviews]

    let finalArr = [];

    let entities =await Promise.allSettled(allReviews.map(rev=>entitySentimentAnalyzer(rev))).then(res=>{
        res.forEach((re)=>{
            if(re.status == "fulfilled"){
                finalArr.push(re.value)
            }
        })

        return finalArr
    }).then((...arr)=>{
        res.send({
            data:arr,msg:'Success'
        })
    })


}

const fetchReviews = async() =>{
    console.log('Fetch started')
    let url = './dummy/resort1.json'
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

const entitySentimentAnalyzer = async(review)=>{

    let entitySentiment = await nlp.entitySentiment(review.desc);
    // let entityObj = {
    //     businessId: review.businessId?review.businessId:'',
    //     locationId:review.locationId?review.locationId:'',
    //     desc:review.desc?review.desc:'',
    //     source: review.source?review.source:'',
    //     sourceReviewId: review.sourceReviewId?review.sourceReviewId:'',
    //     entities: [...entitySentiment.entities]
    // }
    return entitySentiment
}

module.exports = {performEntity}