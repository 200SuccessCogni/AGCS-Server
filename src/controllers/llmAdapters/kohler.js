const openAi = require('../../utils/openai');

const kohlerPrompt = async(review)=>{
    const SYSTEM =
    `You are an assistant designed to perform sentiment analysis and entity sentiment analysis for Kohler Bathroom ad sanitary fitttings on the text review. Perform aspect based sentiment analysis on the below customer review. \n  
    
    Your sentimental analysis and entity sentiment should include the following details:\n
    
    Sentiment: The overall positive, negative, or neutral sentiment expressed towards Kohler's products and services. This reflects the satisfaction level of customers.\n
    Sentiment Score: A numerical score representing the sentiment of the review, usually an ranging from -1 to +1.\n
    Sentiment Magnitude: A numerical score indicating the intensity of sentiment in the review, usually an integer ranging from 1 to 10.\n
    
    Product Quality: Commentary on specific aspects of Kohler's products, such as durability, functionality, and design quality of fixtures like faucets, bathtubs, sinks, etc.\n
    Product Quality Score: Numerical score given to the product quality mentioned in the review, usually ranging from -1 to +1.\n
    Product Magnitude: A numerical score indicating the intensity of review sentiment about the product quality, usually ranging from 1 to 10.\n

    Design Aesthetics: Refers to comments on the design aspects of the products, such as visual appeal, style and design innovation (such as modern, traditional, sleek, etc.)\n
    Design Aesthetics Score: Numerical score for the sentiment expressed about product design, usually ranging from -1 to +1.\n
    Design Aesthetics Magnitude: A numerical score indicating the intensity of review sentiment about the design aesthetics, usually ranging from 1 to 10.\n

    Installation Experience: Feedback on the ease or difficulty of installing Kohler products.\n
    Installation Experience Score: Numerical score given to the installation experience, usually ranging from -1 to +1.\n
    Installation Experience Magnitude: A numerical score indicating the intensity of review sentiment about the installation experience, usually ranging from 1 to 10.\n
    
    Product Functionality: Refers to how well the products function, including aspects like water pressure, ease of use, etc.\n
    Product Functionality Score: Numerical score for the functionality of the products, usually ranging from -1 to +1.\n
    Product Functionality Magnitude: A numerical score indicating the intensity of review sentiment about the product functionality, usually ranging from 1 to 10.\n
    
    Durability: Comments on the longevity and wear-resistance of the products.\n
    Durability Score: Numerical score given to product durability, usually ranging from -1 to +1.\n
    Durability Magnitude: A numerical score indicating the intensity of review sentiment about the durability, usually ranging from 1 to 10.\n
    
    Customer Service: Feedback on interactions with Kohler's customer service team, including responsiveness, helpfulness, and problem-solving.\n
    Customer Service Score: Numerical score for customer service quality, usually ranging from -1 to +1.\n
    Customer Service Magnitude: A numerical score indicating the intensity of review sentiment about the customer service, usually ranging from 1 to 10.\n
    
    Price: Comments on the pricing of Kohler's products, whether they are seen as affordable, expensive, or value for money.\n
    Price Sentiment Score: Numerical score reflecting sentiment about product pricing, usually ranging from -1 to +1.\n
    Price Magnitude: A numerical score indicating the intensity of the review sentiment about the price, usually ranging from 1 to 10.\n
    
    Recommendation: Whether the reviewer would recommend Kohler's products to others, a strong indicator of customer satisfaction.\n
    Recommendation Score: Numerical score given to the recommendation sentiment, usually ranging from -1 to +1.\n
    Recommendation Magnitude: A numerical score indicating the intensity of the review sentiment about the recommendation, usually ranging from 1 to 10.\n

    Return Intent: Indicates whether the reviewer intends to purchase Kohler products in the future, a measure of brand loyalty.\n
    Return Intent Score: Numerical score for the return intent, usually ranging from -1 to +1.\n
    Return Intent Magnitude: A numerical score indicating the intensity of the review sentiment about the return intent, usually ranging from 1 to 10.\n
    
    Cleanliness and Maintenance: Refers to the ease of cleaning and maintaining the products.\n
    Cleanliness and Maintenance Score: Numerical score given to cleanliness and maintenance aspects, usually ranging from -1 to +1.\n
    Cleanliness and Maintenance Magnitude: A numerical score indicating the intensity of the review sentiment about the cleanliness and maintenance, usually ranging from 1 to 10.\n    
    
    If no text is presented in any categories keep it [0] only. Focus only on entity keywords, do not provide sentences.\n
    - Response should strictly be in valid JSON specified in the output format.\n
    - The JSON format should be ready to be use in a code.\n
    - Only extract the entities which are present in the output format.`
    
    const USER = `${review.desc}`
    
    const ASSISTANT =
    `Your output response should contain the below details from the chat input.\n  
    Output Format: \n        
    
    \"Sentiment\": [],\n        
    \"Sentiment_Score\": [],\n   
    \"Sentiment_Magnitude\": [],\n        
    
    \"Product_Quality\": [],\n        
    \"Product_Quality_Score\": [],\n       
    \"Product_Quality_Magnitude\": [],\n

    \"Design_Aesthetics\": [],\n        
    \"Design_Aesthetics_Score\": [],\n        
    \"Design_Aesthetics_Magnitude\": [],\n

    \"Installation_Experience\": [],\n        
    \"Installation_Experience_Score\": [],\n        
    \"Installation_Experience_Magnitude\": [],\n

    \"Product_Functionality\": [],\n        
    \"Product_Functionality_Score\": [],\n        
    \"Product_Functionality_Magnitude\": [],\n

    \"Durability\": [],\n        
    \"Durability_Score\": [],\n        
    \"Durability_Magnitude\": [],\n

    \"Customer_Service\": [],\n        
    \"Customer_Service_Score\": [],\n        
    \"Customer_Service_Magnitude\": [],\n

    \"Price\": [],\n        
    \"Price_Score\": [],\n        
    \"Price_Magnitude\": [],\n

    \"Recommendation\": [],\n        
    \"Recommendation_Score\": [],\n        
    \"Recommendation_Magnitude\": [],\n

    \"Return_Intent\": [],\n       
    \"Return_Intent_Score\": [],\n        
    \"Return_Intent_Magnitude\": [],\n

    \"Cleanliness_Maintenance\": [],\n        
    \"Cleanliness_Maintenance_Score\": []
    \"Cleanliness_Maintenance_Magnitude\": [],\n`

 
    const finalPrompt = `${SYSTEM} ${USER} ${ASSISTANT}`

    try{
        let analysis = await openAi.generativeResponse(finalPrompt)
        console.log(analysis)
        // llmAnalyzedResArr.push(analysis);
        let formattedResponse = await JSON.parse(analysis)
    
        let score = formattedResponse.Sentiment_Score? parseFloat(formattedResponse.Sentiment_Score).toFixed(2): 0
        let magnitude = formattedResponse.Sentiment_Magnitude? parseFloat(formattedResponse.Sentiment_Magnitude).toFixed(2): 0
        review['isSeen'] = false,
        review['isActioned'] = categorizeActionItem(score,magnitude),
        review['replyMessage'] = '',
        review['sentimentScore'] = score,
        review['sentimentMagnitude'] = magnitude,
        review['category'] = categorizeSentiment(score,magnitude),
        review['Product_Quality'] = formattedResponse.Product_Quality,
        review['Product_Quality_Score'] = formattedResponse.Product_Quality_Score,
        review['Product_Quality_Magnitude'] = formattedResponse.Product_Quality_Magnitude,
        review['Design_Aesthetics'] = formattedResponse.Design_Aesthetics,
        review['Design_Aesthetics_Score'] = formattedResponse.Design_Aesthetics_Score,
        review['Design_Aesthetics_Magnitude'] = formattedResponse.Design_Aesthetics_Magnitude,
        review['Installation_Experience'] = formattedResponse.Installation_Experience,
        review['Installation_Experience_Score'] = formattedResponse.Installation_Experience_Score,
        review['Installation_Experience_Magnitude'] = formattedResponse.Installation_Experience_Magnitude,
        review['Product_Functionality'] = formattedResponse.Product_Functionality,
        review['Product_Functionality_Score'] = formattedResponse.Product_Functionality_Score,
        review['Product_Functionality_Magnitude'] = formattedResponse.Product_Functionality_Magnitude,
        review['Durability'] = formattedResponse.Durability,
        review['Durability_Score'] = formattedResponse.Durability_Score,
        review['Durability_Magnitude'] = formattedResponse.Durability_Magnitude,
        review['Customer_Service'] = formattedResponse.Customer_Service,
        review['Customer_Service_Score'] = formattedResponse.Customer_Service_Score,
        review['Customer_Service_Magnitude'] = formattedResponse.Customer_Service_Magnitude,
        review['Price'] = formattedResponse.Price,
        review['Price_Score'] = formattedResponse.Price_Score,
        review['Price_Magnitude'] = formattedResponse.Price_Magnitude,
        review['Recommendation'] = formattedResponse.Recommendation,
        review['Recommendation_Score'] = formattedResponse.Recommendation_Score,
        review['Recommendation_Magnitude'] = formattedResponse.Recommendation_Magnitude,
        review['Return_Intent'] = formattedResponse.Return_Intent,
        review['Return_Intent_Score'] = formattedResponse.Return_Intent_Score,
        review['Return_Intent_Magnitude'] = formattedResponse.Return_Intent_Magnitude,
        review['Cleanliness_Maintenance'] = formattedResponse.Cleanliness_Maintenance,
        review['Cleanliness_Maintenance_Score'] = formattedResponse.Cleanliness_Maintenance_Score,
        review['Cleanliness_Maintenance_Magnitude'] = formattedResponse.Cleanliness_Maintenance_Magnitude,
        delete review.method
        
        return review
    }catch(err){
        let errObj = {
            err: err,
            review:review
        }
        return errObj
    }

}


const entityMapping = (reviews)=>{

    let locationReviews =  [...reviews];
    let entitySentimentArr = [];
    for(i=0;i<locationReviews.length;i++){

        let entityObjArr = [];
        let entityDetails = [];    
        // For product quality
        if(Array.isArray(locationReviews[i].Product_Quality) && locationReviews[i].Product_Quality.length>0){
            let insightArr = [...locationReviews[i].Product_Quality]
            let insightScoreArr = locationReviews[i].Product_Quality_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Product_Quality == "string" && locationReviews[i].Product_Quality && locationReviews[i].Product_Quality !="null" && locationReviews[i].Product_Quality.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Product_Quality,
                score: locationReviews[i].Product_Quality_Score
            }    
            entityDetails.push(insight)
        }

        // For design aesthetics
        if(Array.isArray(locationReviews[i].Design_Aesthetics) && locationReviews[i].Design_Aesthetics.length>0){
            let insightArr = [...locationReviews[i].Design_Aesthetics]
            let insightScoreArr = locationReviews[i].Design_Aesthetics_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Design_Aesthetics == "string" && locationReviews[i].Design_Aesthetics && locationReviews[i].Design_Aesthetics !="null" && locationReviews[i].Design_Aesthetics.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Design_Aesthetics,
                score: locationReviews[i].Design_Aesthetics_Score
            }    
            entityDetails.push(insight)
        }

        // For installation experience
        if(Array.isArray(locationReviews[i].Installation_Experience) && locationReviews[i].Installation_Experience.length>0){
            let insightArr = [...locationReviews[i].Installation_Experience]
            let insightScoreArr = locationReviews[i].Installation_Experience_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Installation_Experience == "string" && locationReviews[i].Installation_Experience && locationReviews[i].Installation_Experience !="null" && locationReviews[i].Installation_Experience.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Installation_Experience,
                score: locationReviews[i].Installation_Experience_Score
            }    
            entityDetails.push(insight)
        }


        // For product functionality
        if(Array.isArray(locationReviews[i].Product_Functionality) && locationReviews[i].Product_Functionality.length>0){
            let insightArr = [...locationReviews[i].Product_Functionality]
            let insightScoreArr = locationReviews[i].Product_Functionality_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Product_Functionality == "string" && locationReviews[i].Product_Functionality && locationReviews[i].Product_Functionality !="null" && locationReviews[i].Product_Functionality.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Product_Functionality,
                score: locationReviews[i].Product_Functionality_Score
            }    
            entityDetails.push(insight)
        }

        // For durability
        if(Array.isArray(locationReviews[i].Durability) && locationReviews[i].Durability.length>0){
            let insightArr = [...locationReviews[i].Durability]
            let insightScoreArr = locationReviews[i].Durability_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Durability == "string" && locationReviews[i].Durability && locationReviews[i].Durability !="null" && locationReviews[i].Durability.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Durability,
                score: locationReviews[i].Durability_Score
            }    
            entityDetails.push(insight)
        }

        // For customer service
        if(Array.isArray(locationReviews[i].Customer_Service) && locationReviews[i].Customer_Service.length>0){
            let insightArr = [...locationReviews[i].Customer_Service]
            let insightScoreArr = locationReviews[i].Customer_Service_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Customer_Service == "string" && locationReviews[i].Customer_Service && locationReviews[i].Customer_Service !="null" && locationReviews[i].Customer_Service.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Customer_Service,
                score: locationReviews[i].Customer_Service_Score
            }    
            entityDetails.push(insight)
        }    


        // For price
        if(Array.isArray(locationReviews[i].Price) && locationReviews[i].Price.length>0){
            let insightArr = [...locationReviews[i].Price]
            let insightScoreArr = locationReviews[i].Price_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Price == "string" && locationReviews[i].Price && locationReviews[i].Price !="null" && locationReviews[i].Price.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Price,
                score: locationReviews[i].Price_Score
            }    
            entityDetails.push(insight)
        }

        // For recommendation
        if(Array.isArray(locationReviews[i].Recommendation) && locationReviews[i].Recommendation.length>0){
            let insightArr = [...locationReviews[i].Recommendation]
            let insightScoreArr = locationReviews[i].Recommendation_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Recommendation == "string" && locationReviews[i].Recommendation && locationReviews[i].Recommendation !="null" && locationReviews[i].Recommendation.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Recommendation,
                score: locationReviews[i].Recommendation_Score
            }    
            entityDetails.push(insight)
        }


        // For return intent
        if(Array.isArray(locationReviews[i].Return_Intent) && locationReviews[i].Return_Intent.length>0){
            let insightArr = [...locationReviews[i].Return_Intent]
            let insightScoreArr = locationReviews[i].Return_Intent_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Return_Intent == "string" && locationReviews[i].Return_Intent && locationReviews[i].Return_Intent !="null" && locationReviews[i].Return_Intent.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Return_Intent,
                score: locationReviews[i].Return_Intent_Score
            }    
            entityDetails.push(insight)
        }

        // For cleanliness maintenance
        if(Array.isArray(locationReviews[i].Cleanliness_Maintenance) && locationReviews[i].Cleanliness_Maintenance.length>0){
            let insightArr = [...locationReviews[i].Cleanliness_Maintenance]
            let insightScoreArr = locationReviews[i].Cleanliness_Maintenance_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Cleanliness_Maintenance == "string" && locationReviews[i].Cleanliness_Maintenance && locationReviews[i].Return_Intent !="null" && locationReviews[i].Return_Intent !="N/A"){
            let insight = {
                entity:locationReviews[i].Cleanliness_Maintenance,
                score: locationReviews[i].Cleanliness_Maintenance_Score
            }    
            entityDetails.push(insight)
        }


        // let entityDetails = [...locationReviews[i].entities]

        console.log(entityDetails)

        entityDetails.forEach((en)=>{
            // if(!en.entity ||!en.sentence )return;
            // let sentence = en.sentence? en.sentence: '';
            let entityName = en.entity?en.entity.toString():'';
            let score = en.score?en.score:0;
            let magnitude = en.magnitude?en.magnitude:0; 
            const entityScore = {
                sentence: "",
                entityName: entityName,
                sentimentScore:score,
                sentimentMagnitude: 0,
                // category: categorizeSentiment(score,magnitude),
                // actionItem: categorizeActionItem(score,magnitude),
                category: "",
                actionItem: "",
                date: locationReviews[i].date?locationReviews[i].date:''
            }

            entityObjArr.push(entityScore)
        })

        let entityObj = {
            businessId: locationReviews[i].businessId?locationReviews[i].businessId.toString():'',
            locationId: locationReviews[i].locationId?locationReviews[i].locationId.toString():'',
            desc: locationReviews[i].desc?locationReviews[i].desc:'',
            source: locationReviews[i].source?locationReviews[i].source:'',
            sourceReviewId:locationReviews[i].sourceReviewId?locationReviews[i].sourceReviewId:'',
            entityScores: [...entityObjArr],
        }

        entitySentimentArr.push(entityObj)
    }

    return entitySentimentArr;
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


module.exports = { kohlerPrompt,entityMapping }