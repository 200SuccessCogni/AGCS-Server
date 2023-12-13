const openAi = require('../../utils/openai');

const restaurantPrompt = async(review)=>{
        const SYSTEM = `You are an assistant designed to perform sentiment analysis and entity sentiment analysis 
        on the text review.Perform aspect based sentiment analysis on the below customer review. \n    
        Your sentimental analysis and entity sentiment should include the following details:\n    
        Sentiment: The overall positive, negative or neutral sentiment expressed towards the restaurant/food. 
        This indicates the satisfaction level of customers.  
        \n    Sentiment score: Refers to a numerical score given to the sentiment of the review, usually ranging from -1 to +1.
        \n    Sentiment magnitude: Refers to a numerical score given to the sentiment magnitude of the review, usually ranging from 1 to 10.
        \n    Food quality: Specific aspects of the dining experience commented on like quality of solid foods like burger, pizza,donut etc. 
        This information helps in identifying the strengths and weaknesses of the restaurant.
        \n    Food quality score: Refers to the different food quality of the restaurant that were rated in the review usually ranging from -1 to +1.
        \n    Food quality magnitude: Refers to a numerical score given to the food quality magnitude of the review, usually ranging from 1 to 10.
        \n   Taste descriptors: Refers to the specific flavors or tastes that are mentioned in the review sentence. 
        Words used to describe how the food tasted like delicious, fresh, flavorful, bland etc. 
        This provides feedback on dishes and helps in improving the quality of food.  \n    
        Taste descriptor sentiment score: Refers to a numerical score given to the sentiment of the taste descriptors mentioned in the review sentence usually ranging from -1 to +1.  
        \n    Taste descriptors magnitude: Refers to a numerical score given to the taste descriptors magnitude of the review, usually ranging from 1 to 10.
        \n    Portion size: Refers to the size of the portions of food served at the restaurant. 
        If the portions are described as generous, adequate or small. This is a sign of value and helps customers in deciding what to order.  
        \n    Portion size score: Refers to a numerical score given to the portion size mentioned in the review sentence usually ranging from -1 to +1.  
        \n    Portion size magnitude: Refers to a numerical score given to the portion size magnitude of the review, usually ranging from 1 to 10.
        \n    Food items likes: Refers to the specific food items that the reviewer liked that are mentioned in the review sentence.  
        \n    Food items likes score: Refers to a numerical score given to the food items liked mentioned in the review sentence usually ranging from -1 to +1. 
        \n    Food items likes magnitude: Refers to a numerical score given to the food items liked magnitude of the review, usually ranging from 1 to 10.
        \n    Food items dislikes: Refers to the specific food items that the reviewer did not like that are mentioned in the review sentence.
        \n    Food items dislikes score: Refers to a numerical score given to the food items disliked mentioned in the review sentence usually ranging from -1 to +1.  
        \n    Food items dislikes magnitude: Refers to a numerical score given to the food items disliked magnitude of the review, usually ranging from 1 to 10.
        \n    Wait time: Refers to the amount of time the reviewer had to wait for their food or for a table. 
        Any comments on wait duration for table or food. This indicates capacity issues and helps in improving the efficiency of the restaurant.  
        \n    Wait time sentiment score: Refers to a numerical score given to the sentiment of the wait time usually ranging from -1 to +1.  
        \n    Wait time magnitude: Refers to a numerical score given to the wait time magnitude of the review, usually ranging from 1 to 10.
        \n    Staff behavior: Refers to the behavior of the staff at the restaurant. Feedback on staff interactions, friendliness, efficiency or rudeness. 
        This is important for customer experience and helps in training staff. Do not consider any staff name or person name and also their designations.
        \n    Staff behavior score: Refers to a numerical score given to the behavior of the staff mentioned in the review sentence usually ranging from -1 to +1.  
        \n    Staff behavior magnitude: Refers to a numerical score given to the Staff behavior magnitude of the review, usually ranging from 1 to 10.
        \n    Ambience: Refers to the atmosphere or insiance of the restaurant. Descriptions of decor, music, noise levels. 
        This sets dining atmosphere expectations and helps in improving the overall dining experience.  
        \n    Ambience sentiment score: Refers to a numerical score given to the sentiment of the insiance usually ranging from -1 to +1.  
        \n    Ambience magnitude: Refers to a numerical score given to the ambience magnitude of the review, usually ranging from 1 to 10.
        \n    Price: Refers to the price of the food or drinks at the restaurant. Comments on whether prices were reasonable, expensive or a good value. 
        This provides pricing insights and helps in setting competitive prices.  
        \n    Price sentiment score: Refers to a numerical score given to the sentiment of the price usually ranging from -1 to +1.  
        \n    Price magnitude: Refers to a numerical score given to the price magnitude of the review, usually ranging from 1 to 10.
        \n    Recommendation: Refers to whether or not the reviewer would recommend the restaurant to others. 
        If the reviewer recommends or does not recommend the place. This is a strong indicator of satisfaction and helps in attracting new customers.  
        \n    Recommendation sentiment score: Refers to a numerical score given to the sentiment of the recommendation usually ranging from -1 to +1.  
        \n    Recommendation magnitude: Refers to a numerical score given to the recommendation magnitude of the review, usually ranging from 1 to 10.
        \n    Return intent: Refers to whether or not the reviewer intends to return to the restaurant in the future. Mention of return/repeat visits shows loyalty. This helps in retaining customers and building a loyal customer base.
        \n    Return intent score: Refers to a numerical score given to the return intent usually ranging from -1 to +1.
        \n    Return intent magnitude: Refers to a numerical score given to the return intent magnitude of the review, usually ranging from 1 to 10.
        \n    Beverages quality: Specific aspects of the dining experience commented on like quality of drinks like latte, shakes, espresso, tea etc. 
        This information helps in identifying the strengths and weaknesses of the restaurant. 
        \n    Beverages quality score: Refers to the different beverages quality like latte, shakes, espresso, tea etc of the restaurant that were rated in the review usually ranging from -1 to +1.
        \n    Beverages magnitude: Refers to a numerical score given to the beverages magnitude of the review, usually ranging from 1 to 10.
        \n    Cleanliness: Referring to the cleanliness of the restaurant.
        \n    Cleanliness score: Refers to a numerical score given to the cleanliness mentioned in the review sentence, usually ranging from -1 to +1.
        \n    Cleanliness magnitude: Refers to a numerical score given to the cleanliness magnitude of the review, usually ranging from 1 to 10.
        \n    If no text is presented in any categories keep it [0] only. Focus only on entity keywords, do not provide sentences. 
        \n - Response should strictly be in valid JSON specified in the output format. 
        \n - The JSON format should be ready to be use in a code. 
        \n - Only extract the entities which are present in the output format.`


    const USER = `${review}`

    const ASSISTANT = `
    Your output response should contain the below details from the chat input.
    \n  Output Format:      
    \n        \"Sentiment\": [],\n        \"Sentiment_Score\": [],\n    \"Sentiment_Magnitude\": [],\n        \"Food_Quality\": [],
    \n        \"Food_Quality_Score\": [],\n  \"Food_Quality_Magnitude\": [],\n       \"Taste_Descriptors\": [],\n        \"Taste_Descriptor_Sentiment_Score\": [],
    \n        \"Taste_Descriptors_Magnitude\": [],\n  \"Portion_Size\": [],\n        \"Portion_Size_Score\": [],\n  \"Portion_Size_Magnitude\": [],\n       \"Food_Items_Likes\": [],
    \n        \"Food_Items_Likes_Score\": [],\n  \"Food_Items_Likes_Magnitude\": [],\n         \"Food_Items_Dislikes\": [],\n        \"Food_Items_Dislikes_Score\": [],
    \n        \"Food_Items_Dislikes_Magnitude\": [],\n    \"Wait_Time\": [],\n        \"Wait_Time_Sentiment_Score\": [],\n    \"Wait_Time_Magnitude\": [],\n     \"Staff_Behavior\": [],
    \n        \"Staff_Behavior_Score\": [],\n   \"Staff_Behavior_Magnitude\": [],\n       \"Ambience\": [],
    \n        \"Ambience_Sentiment_Score\": [],\n    \"Ambience_Magnitude\": [],\n     \"Price\": [],\n        \"Price_Sentiment_Score\": [],
    \n        \"Price_Magnitude\": [],\n         \"Recommendation\": [],\n        \"Recommendation_Sentiment_Score\": [],
    \n        \"Recommendation_Magnitude\": [],\n      \"Return_Intent\": [],\n        \"Return_Intent_Score\": [],\n   \"Return_Intent_Magnitude\": [],\n     \"Beverages_Quality\": [],
    \n        \"Beverages_Quality_Score\": [],\n    \"Beverages_Quality_Magnitude\": [],\n    \"Cleanliness\": [],\n        \"Cleanliness_Score\": []   \"Cleanliness_Magnitude\": [],\n  `

    const finalPrompt = `${SYSTEM} ${USER} ${ASSISTANT}`

    try{
        let analysis = await openAi.generativeResponse(finalPrompt)
        console.log(analysis)
        llmAnalyzedResArr.push(analysis);
        let formattedResponse = await JSON.parse(analysis)
    
        let score = formattedResponse.Sentiment_Score? parseFloat(formattedResponse.Sentiment_Score).toFixed(2): 0
        let magnitude = formattedResponse.Sentiment_Magnitude? parseFloat(formattedResponse.Sentiment_Magnitude).toFixed(2): 0
        review['isSeen'] = false,
        review['isActioned'] = categorizeActionItem(score,magnitude),
        review['replyMessage'] = '',
        review['sentimentScore'] = score,
        review['sentimentMagnitude'] = magnitude,
        review['category'] = categorizeSentiment(score,magnitude),
        review['Food_Quality'] = formattedResponse.Food_Quality,
        review['Food_Quality_Score'] = formattedResponse.Food_Quality_Score,
        review['Food_Quality_Magnitude'] = formattedResponse.Food_Quality_Magnitude,
        review['Taste_Descriptors'] = formattedResponse.Taste_Descriptors,
        review['Taste_Descriptor_Sentiment_Score'] = formattedResponse.Taste_Descriptor_Sentiment_Score,
        review['Taste_Descriptors_Magnitude'] = formattedResponse.Taste_Descriptors_Magnitude,
        review['Portion_Size'] = formattedResponse.Portion_Size,
        review['Portion_Size_Score'] = formattedResponse.Portion_Size_Score,
        review['Portion_Size_Magnitude'] = formattedResponse.Portion_Size_Magnitude,
        review['Food_Items_Likes'] = formattedResponse.Food_Items_Likes,
        review['Food_Items_Likes_Score'] = formattedResponse.Food_Items_Likes_Score,
        review['Food_Items_Likes_Magnitude'] = formattedResponse.Food_Items_Likes_Magnitude,
        review['Food_Items_Dislikes'] = formattedResponse.Food_Items_Dislikes,
        review['Food_Items_Dislikes_Score'] = formattedResponse.Food_Items_Dislikes_Score,
        review['Food_Items_Dislikes_Magnitude'] = formattedResponse.Food_Items_Dislikes_Magnitude,
        review['Wait_Time'] = formattedResponse.Wait_Time,
        review['Wait_Time_Sentiment_Score'] = formattedResponse.Wait_Time_Sentiment_Score,
        review['Wait_Time_Magnitude'] = formattedResponse.Wait_Time_Magnitude,
        review['Staff_Behavior'] = formattedResponse.Staff_Behavior,
        review['Staff_Behavior_Score'] = formattedResponse.Staff_Behavior_Score,
        review['Staff_Behavior_Magnitude'] = formattedResponse.Staff_Behavior_Magnitude,
        review['Ambience'] = formattedResponse.Ambience,
        review['Ambience_Sentiment_Score'] = formattedResponse.Ambience_Sentiment_Score,
        review['Ambience_Magnitude'] = formattedResponse.Ambience_Magnitude,
        review['Price'] = formattedResponse.Price,
        review['Price_Sentiment_Score'] = formattedResponse.Price_Sentiment_Score,
        review['Price_Magnitude'] = formattedResponse.Price_Magnitude,
        review['Recommendation'] = formattedResponse.Recommendation_Sentiment_Score,
        review['Recommendation_Sentiment_Score'] = formattedResponse.Recommendation_Sentiment_Score,
        review['Recommendation_Magnitude'] = formattedResponse.Recommendation_Magnitude,
        review['Return_Intent'] = formattedResponse.Return_Intent,
        review['Return_Intent_Score'] = formattedResponse.Return_Intent_Score,
        review['Return_Intent_Magnitude'] = formattedResponse.Return_Intent_Magnitude,
        review['Beverages_Quality'] = formattedResponse.Beverages_Quality,
        review['Beverages_Quality_Score'] = formattedResponse.Beverages_Quality_Score,
        review['Beverages_Quality_Magnitude'] = formattedResponse.Beverages_Quality_Magnitude,
        review['Cleanliness'] = formattedResponse.Cleanliness,
        review['Cleanliness_Score'] = formattedResponse.Cleanliness_Score
        review['Cleanliness_Magnitude'] = formattedResponse.Cleanliness_Magnitude,
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
        // For ambience
        if(Array.isArray(locationReviews[i].Ambience) && locationReviews[i].Ambience.length>0){
            let insightArr = [...locationReviews[i].Ambience]
            let insightScoreArr = locationReviews[i].Ambience_Sentiment_Score
            let insightMag = locationReviews[i].Ambience_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Ambience == "string" && locationReviews[i].Ambience && locationReviews[i].Ambience !="null" && locationReviews[i].Ambience.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Ambience,
                score: locationReviews[i].Ambience_Sentiment_Score
            }    
            entityDetails.push(insight)
        }

        // For beverages
        if(Array.isArray(locationReviews[i].Beverages_Quality) && locationReviews[i].Beverages_Quality.length>0){
            let insightArr = [...locationReviews[i].Beverages_Quality]
            let insightScoreArr = locationReviews[i].Beverages_Quality_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Beverages_Quality == "string" && locationReviews[i].Beverages_Quality && locationReviews[i].Beverages_Quality !="null" && locationReviews[i].Beverages_Quality.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Beverages_Quality,
                score: locationReviews[i].Beverages_Quality_Score
            }    
            entityDetails.push(insight)
        }

        // For cleanliness
        if(Array.isArray(locationReviews[i].Cleanliness) && locationReviews[i].Cleanliness.length>0){
            let insightArr = [...locationReviews[i].Cleanliness]
            let insightScoreArr = locationReviews[i].Cleanliness_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Cleanliness == "string" && locationReviews[i].Cleanliness && locationReviews[i].Cleanliness !="null" && locationReviews[i].Cleanliness.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Cleanliness,
                score: locationReviews[i].Cleanliness_Score
            }    
            entityDetails.push(insight)
        }


        // For food_items_dislikes
        if(Array.isArray(locationReviews[i].Food_Items_Dislikes) && locationReviews[i].Food_Items_Dislikes.length>0){
            let insightArr = [...locationReviews[i].Food_Items_Dislikes]
            let insightScoreArr = locationReviews[i].Food_Items_Dislikes_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Food_Items_Dislikes == "string" && locationReviews[i].Food_Items_Dislikes && locationReviews[i].Food_Items_Dislikes !="null" && locationReviews[i].Food_Items_Dislikes.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Food_Items_Dislikes,
                score: locationReviews[i].Food_Items_Dislikes_Score
            }    
            entityDetails.push(insight)
        }

        // For food item likes
        if(Array.isArray(locationReviews[i].Food_Items_Likes) && locationReviews[i].Food_Items_Likes.length>0){
            let insightArr = [...locationReviews[i].Food_Items_Likes]
            let insightScoreArr = locationReviews[i].Food_Items_Likes_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Food_Items_Likes == "string" && locationReviews[i].Food_Items_Likes && locationReviews[i].Food_Items_Likes !="null" && locationReviews[i].Food_Items_Likes.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Food_Items_Likes,
                score: locationReviews[i].Food_Items_Likes_Score
            }    
            entityDetails.push(insight)
        }

        // For food quality
        if(Array.isArray(locationReviews[i].Food_Quality) && locationReviews[i].Food_Quality.length>0){
            let insightArr = [...locationReviews[i].Food_Quality]
            let insightScoreArr = locationReviews[i].Food_Quality_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Food_Quality == "string" && locationReviews[i].Food_Quality && locationReviews[i].Food_Quality !="null" && locationReviews[i].Food_Quality.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Food_Quality,
                score: locationReviews[i].Food_Quality_Score
            }    
            entityDetails.push(insight)
        }    


        // For portion size
        if(Array.isArray(locationReviews[i].Portion_Size) && locationReviews[i].Portion_Size.length>0){
            let insightArr = [...locationReviews[i].Portion_Size]
            let insightScoreArr = locationReviews[i].Portion_Size_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Portion_Size == "string" && locationReviews[i].Portion_Size && locationReviews[i].Portion_Size !="null" && locationReviews[i].Portion_Size.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Portion_Size,
                score: locationReviews[i].Portion_Size_Score
            }    
            entityDetails.push(insight)
        }

        // For price
        if(Array.isArray(locationReviews[i].Price) && locationReviews[i].Price.length>0){
            let insightArr = [...locationReviews[i].Price]
            let insightScoreArr = locationReviews[i].Price_Sentiment_Score
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
                score: locationReviews[i].Price_Sentiment_Score
            }    
            entityDetails.push(insight)
        }


        // For recommendation
        if(Array.isArray(locationReviews[i].Recommendation) && locationReviews[i].Recommendation.length>0){
            let insightArr = [...locationReviews[i].Recommendation]
            let insightScoreArr = locationReviews[i].Recommendation_Sentiment_Score
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
                score: locationReviews[i].Recommendation_Sentiment_Score
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

        // For staff behavior
        if(Array.isArray(locationReviews[i].Staff_Behavior) && locationReviews[i].Staff_Behavior.length>0){
            let insightArr = [...locationReviews[i].Staff_Behavior]
            let insightScoreArr = locationReviews[i].Staff_Behavior_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Staff_Behavior == "string" && locationReviews[i].Staff_Behavior && locationReviews[i].Staff_Behavior !="null" && locationReviews[i].Staff_Behavior.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Staff_Behavior,
                score: locationReviews[i].Staff_Behavior_Score
            }    
            entityDetails.push(insight)
        }

        // For taste descriptors
        if(Array.isArray(locationReviews[i].Taste_Descriptors) && locationReviews[i].Taste_Descriptors.length>0){
            let insightArr = [...locationReviews[i].Taste_Descriptors]
            let insightScoreArr = locationReviews[i].Taste_Descriptor_Sentiment_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Taste_Descriptors == "string" && locationReviews[i].Taste_Descriptors && locationReviews[i].Taste_Descriptors !="null" && locationReviews[i].Taste_Descriptors.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Taste_Descriptors,
                score: locationReviews[i].Taste_Descriptor_Sentiment_Score
            }    
            entityDetails.push(insight)
        }

        // For wait time
        if(Array.isArray(locationReviews[i].Wait_Time) && locationReviews[i].Wait_Time.length>0){
            let insightArr = [...locationReviews[i].Wait_Time]
            let insightScoreArr = locationReviews[i].Wait_Time_Sentiment_Score
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Wait_Time == "string" && locationReviews[i].Wait_Time && locationReviews[i].Wait_Time !="null" && locationReviews[i].Wait_Time.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Wait_Time,
                score: locationReviews[i].Wait_Time_Sentiment_Score
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
                category: categorizeSentiment(score,magnitude),
                actionItem: categorizeActionItem(score,magnitude),
                // category: "",
                // actionItem: "",
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

module.exports = { restaurantPrompt,entityMapping }