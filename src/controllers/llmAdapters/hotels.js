const openAi = require('../../utils/openai');

const hotelPrompt = async(review)=>{

    const SYSTEM =
    `You are an assistant designed to perform sentiment analysis and entity sentiment analysis for Marriott Hotels and Resorts on the text review. Perform aspect-based sentiment analysis on the below customer review. \n  
    Your sentiment analysis and entity sentiment should include the following details:\n
    Sentiment: The overall positive, negative, or neutral sentiment expressed towards Marriott's services and facilities. This reflects the satisfaction level of guests.\n
    Sentiment Score: A numerical score representing the sentiment of the review, usually ranging from -1 to +1.\n
    Sentiment Magnitude: A numerical score indicating the intensity of sentiment in the review, usually ranging from 1 to 10.\n
    Theme: The theme of the review - whether it is a complain, a praise, a constructive feedback or an experience shared by the customer. \n
    Room Quality: Comments on specific aspects of the hotel rooms, such as comfort, amenities, cleanliness, and views.\n
    Room Quality Score: Numerical score given to the room quality mentioned in the review, usually ranging from -1 to +1.\n
    Room Quality Magnitude: Refers to a numerical score given to the room quality magnitude of the review, usually ranging from 1 to 10. \n
    Service Quality: Feedback on the quality of service provided by hotel staff, including reception, housekeeping, and concierge services.\n
    Service Quality Score: Numerical score for the sentiment expressed about service quality, usually ranging from -1 to +1.\n
    Service Quality Magnitude: Refers to a numerical score given to the service quality magnitude of the review, usually ranging from 1 to 10. \n
    Facilities: Comments on the hotel facilities like the pool, gym, spa, business center, etc.\n
    Facilities Score: Numerical score given to the hotel facilities, usually ranging from -1 to +1.\n
    Facilities Magnitude: Refers to a numerical score given to the facility magnitude of the review, usually ranging from 1 to 10. \n    
    Dining Experience: Feedback on the hotel's dining options, including restaurant quality, variety, and room service.\n
    Dining Experience Score: Numerical score for the dining experience, usually ranging from -1 to +1.\n
    Dining Experience Magnitude: Refers to a numerical score given to the dining experience magnitude of the review, usually ranging from 1 to 10. \n
    Location: Remarks on the hotel's location in relation to attractions, convenience, and scenic value.\n
    Location Score: Numerical score given to the hotel's location, usually ranging from -1 to +1.\n
    Location Magnitude: Refers to a numerical score given to the location magnitude of the review, usually ranging from 1 to 10. \n
    Price: Comments on the pricing of Marriott's services, whether they are seen as affordable, expensive, or value for money.\n
    Price Score: Numerical score reflecting sentiment about pricing, usually ranging from -1 to +1.\n
    Price Magnitude: Refers to a numerical score given to the price magnitude of the review, usually ranging from 1 to 10. \n
    Recommendation: Whether the reviewer would recommend Marriott to others, a strong indicator of guest satisfaction.\n
    Recommendation Score: Numerical score given to the recommendation sentiment, usually ranging from -1 to +1.\n
    Recommendation Magnitude: Refers to a numerical score given to the recommendation experience magnitude of the review, usually ranging from 1 to 10. \n
    Wait time: Refers to the amount of time the reviewer had to wait for their food or for a table. Any comments on wait duration for table or food. This indicates capacity issues and helps in improving the efficiency of the restaurant.  \n
    Wait time sentiment score: Refers to a numerical score given to the sentiment of the wait time usually ranging from -1 to +1.  \n
    Wait time magnitude: Refers to a numerical score given to the wait time magnitude of the review, usually ranging from 1 to 10. \n
    Staff behavior: Refers to the behavior of the staff at the restaurant. Feedback on staff interactions, friendliness, efficiency or rudeness. This is important for customer experience and helps in training staff. Do not consider any staff name or person name and also their designations. \n
    Staff behavior score: Refers to a numerical score given to the behavior of the staff mentioned in the review sentence usually ranging from -1 to +1.  \n
    Staff behavior magnitude: Refers to a numerical score given to the Staff behavior magnitude of the review, usually ranging from 1 to 10. \n
    Return Intent: Indicates whether the reviewer intends to stay at Marriott Hotels in the future, a measure of brand loyalty.\n
    Return Intent Score: Numerical score for the return intent, usually ranging from -1 to +1.\n
    Return Intent Magnitude: Refers to a numerical score given to the return intent magnitude of the review, usually ranging from 1 to 10. \n
    Cleanliness: Referring to the cleanliness of the hotel and its facilities.\n
    Cleanliness Score: Numerical score given to cleanliness, usually ranging from -1 to +1.\n
    Cleanliness Magnitude: Refers to a numerical score given to the cleanliness magnitude of the review, usually ranging from 1 to 10. \n
    Ambience: Comments on the atmosphere and general ambiance of the hotel.\n
    Ambience Score: Numerical score given to the hotel's ambience, usually ranging from -1 to +1.
    Ambience Magnitude: Refers to a numerical score given to the ambience magnitude of the review, usually ranging from 1 to 10. \n

    If no text is presented in any categories keep it [0] only. Focus only on entity keywords, do not provide sentences.\n
    - Response should strictly be in valid JSON specified in the output format.\n
    - The JSON format should be ready to be use in a code.\n
    - Only extract the entities which are present in the output format.`

    const USER = `${review.desc}`

    const ASSISTANT =
    `Your output response should contain the below details from the chat input.\n  
    Output Format: \n        
    \"Sentiment": [],\n        
    \"Sentiment_Score": [],\n   
    \"Sentiment_Magnitude": [],\n        
    \"Theme": [], \n
    \"Room_Quality": [],\n        
    \"Room_Quality_Score": [],\n     
    \"Room_Quality_Magnitude\": [],\n  
    \"Service_Quality": [],\n        
    \"Service_Quality_Score": [],\n        
    \"Service_Quality_Magnitude\": [],\n
    \"Facilities": [],\n        
    \"Facilities_Score": [],\n        
    \"Facilities_Magnitude\": [],\n
    \"Dining_Experience": [],\n        
    \"Dining_Experience_Score": [],\n        
    \"Dining_Experience_Magnitude\": [],\n
    \"Location": [],\n        
    \"Location_Score": [],\n        
    \"Location_Magnitude\": [],\n
    \"Price": [],\n        
    \"Price_Score": [],\n        
    \"Price_Magnitude\": [],\n
    \"Recommendation": [],\n        
    \"Recommendation_Score": [],\n        
    \"Recommendation_Magnitude\": [],\n
    \"Wait_Time\": [],\n        
    \"Wait_Time_Score\": [],\n    
    \"Wait_Time_Magnitude\": [],\n     
    \"Staff_Behavior\": [], \n        
    \"Staff_Behavior_Score\": [],\n   
    \"Staff_Behavior_Magnitude\": [],\n
    \"Return_Intent": [],\n       
    \"Return_Intent_Score": [],\n        
    \"Return_Intent_Magnitude\": [],\n
    \"Cleanliness": [],\n        
    \"Cleanliness_Score": [],\n        
    \"Cleanliness_Magnitude\": [],\n
    \"Ambience": [],\n        
    \"Ambience_Score": [], \n
    \"Ambience_Magnitude\": [],\n`
    
    const finalPrompt = `${SYSTEM} ${USER} ${ASSISTANT}`
    let llmAnalyzedResArr = [];

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
        review['theme'] = typeof formattedResponse.Theme == "string"?formattedResponse.Theme:'',
        review['category'] = categorizeSentiment(score,magnitude),
        review['Room_Quality'] = formattedResponse.Room_Quality?formattedResponse.Room_Quality:'',
        review['Room_Quality_Score'] = formattedResponse.Room_Quality_Score?formattedResponse.Room_Quality_Score:'',
        review['Room_Quality_Magnitude'] = formattedResponse.Room_Quality_Magnitude?formattedResponse.Room_Quality_Magnitude:'',
        review['Service_Quality'] = formattedResponse.Service_Quality?formattedResponse.Service_Quality:'',
        review['Service_Quality_Score'] = formattedResponse.Service_Quality_Score?formattedResponse.Service_Quality_Score:'',
        review['Service_Quality_Magnitude'] = formattedResponse.Service_Quality_Magnitude?formattedResponse.Service_Quality_Magnitude:'',
        review['Facilities'] = formattedResponse.Facilities?formattedResponse.Facilities:'',
        review['Facilities_Score'] = formattedResponse.Facilities_Score?formattedResponse.Facilities_Score:'',
        review['Facilities_Magnitude'] = formattedResponse.Facilities_Magnitude?formattedResponse.Facilities_Magnitude:'',
        review['Dining_Experience'] = formattedResponse.Dining_Experience?formattedResponse.Dining_Experience:'',
        review['Dining_Experience_Score'] = formattedResponse.Dining_Experience_Score?formattedResponse.Dining_Experience_Score:'',
        review['Dining_Experience_Magnitude'] = formattedResponse.Dining_Experience_Magnitude?formattedResponse.Dining_Experience_Magnitude:'',
        review['Location'] = formattedResponse.Location?formattedResponse.Location:'',
        review['Location_Score'] = formattedResponse.Location_Score?formattedResponse.Location_Score:'',
        review['Location_Magnitude'] = formattedResponse.Location_Magnitude?formattedResponse.Location_Magnitude:'',
        review['Price'] = formattedResponse.Price?formattedResponse.Price:'',
        review['Price_Score'] = formattedResponse.Price_Score?formattedResponse.Price_Score:'',
        review['Price_Magnitude'] = formattedResponse.Price_Magnitude?formattedResponse.Price_Magnitude:'',
        review['Recommendation'] = formattedResponse.Recommendation?formattedResponse.Recommendation:'',
        review['Recommendation_Score'] = formattedResponse.Recommendation_Score?formattedResponse.Recommendation_Score:'',
        review['Recommendation_Magnitude'] = formattedResponse.Recommendation_Magnitude?formattedResponse.Recommendation_Magnitude:'',
        review['Staff_Behavior'] = formattedResponse.Staff_Behavior?formattedResponse.Staff_Behavior:'',
        review['Staff_Behavior_Score'] = formattedResponse.Staff_Behavior_Score?formattedResponse.Staff_Behavior_Score:'',
        review['Staff_Behavior_Magnitude'] = formattedResponse.Staff_Behavior_Magnitude?formattedResponse.Staff_Behavior_Magnitude:'',
        review['Wait_Time'] = formattedResponse.Wait_Time?formattedResponse.Wait_Time:'',
        review['Wait_Time_Score'] = formattedResponse.Wait_Time_Score?formattedResponse.Wait_Time_Score:'',
        review['Wait_Time_Magnitude'] = formattedResponse.Wait_Time_Magnitude?formattedResponse.Wait_Time_Magnitude:'',
        review['Return_Intent'] = formattedResponse.Return_Intent?formattedResponse.Return_Intent:'',
        review['Return_Intent_Score'] = formattedResponse.Return_Intent_Score?formattedResponse.Return_Intent_Score:'',
        review['Return_Intent_Magnitude'] = formattedResponse.Return_Intent_Magnitude?formattedResponse.Return_Intent_Magnitude:'',
        review['Cleanliness'] = formattedResponse.Cleanliness?formattedResponse.Cleanliness:'',
        review['Cleanliness_Score'] = formattedResponse.Cleanliness_Score?formattedResponse.Cleanliness_Score:'',
        review['Cleanliness_Magnitude'] = formattedResponse.Cleanliness_Magnitude?formattedResponse.Cleanliness_Magnitude:'',
        review['Ambience'] = formattedResponse.Ambience?formattedResponse.Ambience:'',
        review['Ambience_Score'] = formattedResponse.Ambience_Score?formattedResponse.Ambience_Score:'',
        review['Ambience_Magnitude'] = formattedResponse.Ambience_Magnitude?formattedResponse.Ambience_Magnitude:'',
        delete review.method
        
        return review
    }catch(err){
        console.log(err)
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

        // For room quality
        if(Array.isArray(locationReviews[i].Room_Quality) && locationReviews[i].Room_Quality.length>0){
            let insightArr = [...locationReviews[i].Room_Quality]
            let insightScoreArr = locationReviews[i].Room_Quality_Score
            let insightMagnitudeArr = locationReviews[i].Room_Quality_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Room_Quality == "string" && locationReviews[i].Room_Quality && locationReviews[i].Room_Quality.toUpperCase() !="NULL" && locationReviews[i].Room_Quality.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Room_Quality,
                score: locationReviews[i].Room_Quality_Score,
                magnitude: locationReviews[i].Room_Quality_Magnitude
            }    
            entityDetails.push(insight)
        }

        // For service quality
        if(Array.isArray(locationReviews[i].Service_Quality) && locationReviews[i].Service_Quality.length>0){
            let insightArr = [...locationReviews[i].Service_Quality]
            let insightScoreArr = locationReviews[i].Service_Quality_Score
            let insightMagnitudeArr = locationReviews[i].Service_Quality_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Service_Quality == "string" && locationReviews[i].Service_Quality && locationReviews[i].Service_Quality.toUpperCase() !="NULL" && locationReviews[i].Service_Quality.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Service_Quality,
                score: locationReviews[i].Service_Quality_Score,
                magnitude: locationReviews[i].Service_Quality_Magnitude
            }    
            entityDetails.push(insight)
        }


        // For facilities
        if(Array.isArray(locationReviews[i].Facilities) && locationReviews[i].Facilities.length>0){
            let insightArr = [...locationReviews[i].Facilities]
            let insightScoreArr = locationReviews[i].Facilities_Score
            let insightMagnitudeArr = locationReviews[i].Facilities_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Facilities == "string" && locationReviews[i].Facilities && locationReviews[i].Facilities.toUpperCase() !="NULL" && locationReviews[i].Facilities.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Facilities,
                score: locationReviews[i].Facilities_Score,
                magnitude: locationReviews[i].Facilities_Magnitude
            }    
            entityDetails.push(insight)
        }

        // For dining experience
        if(Array.isArray(locationReviews[i].Dining_Experience) && locationReviews[i].Dining_Experience.length>0){
            let insightArr = [...locationReviews[i].Dining_Experience]
            let insightScoreArr = locationReviews[i].Dining_Experience_Score
            let insightMagnitudeArr = locationReviews[i].Dining_Experience_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Dining_Experience == "string" && locationReviews[i].Dining_Experience && locationReviews[i].Dining_Experience.toUpperCase() !="NULL" && locationReviews[i].Dining_Experience.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Dining_Experience,
                score: locationReviews[i].Dining_Experience_Score,
                magnitude: locationReviews[i].Dining_Experience_Magnitude
            }    
            entityDetails.push(insight)
        }    

        // For location
        if(Array.isArray(locationReviews[i].Location) && locationReviews[i].Location.length>0){
            let insightArr = [...locationReviews[i].Location]
            let insightScoreArr = locationReviews[i].Location_Score
            let insightMagnitudeArr = locationReviews[i].Location_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Location == "string" && locationReviews[i].Location && locationReviews[i].Location.toUpperCase() !="NULL" && locationReviews[i].Location.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Location,
                score: locationReviews[i].Location_Score,
                magnitude: locationReviews[i].Location_Magnitude
            }    
            entityDetails.push(insight)
        }

        // For price
        if(Array.isArray(locationReviews[i].Price) && locationReviews[i].Price.length>0){
            let insightArr = [...locationReviews[i].Price]
            let insightScoreArr = locationReviews[i].Price_Score
            let insightMagnitudeArr = locationReviews[i].Price_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Price == "string" && locationReviews[i].Price && locationReviews[i].Price.toUpperCase() !="NULL" && locationReviews[i].Price.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Price,
                score: locationReviews[i].Price_Score,
                magnitude: locationReviews[i].Price_Magnitude
            }    
            entityDetails.push(insight)
        }


        // For recommendation
        if(Array.isArray(locationReviews[i].Recommendation) && locationReviews[i].Recommendation.length>0){
            let insightArr = [...locationReviews[i].Recommendation]
            let insightScoreArr = locationReviews[i].Recommendation_Score
            let insightMagnitudeArr = locationReviews[i].Recommendation_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Recommendation == "string" && locationReviews[i].Recommendation && locationReviews[i].Recommendation.toUpperCase() !="NULL" && locationReviews[i].Recommendation.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Recommendation,
                score: locationReviews[i].Recommendation_Score,
                magnitude: locationReviews[i].Recommendation_Magnitude
            }    
            entityDetails.push(insight)
        }

        // For staff behavior
        if(Array.isArray(locationReviews[i].Staff_Behavior) && locationReviews[i].Staff_Behavior.length>0){
            let insightArr = [...locationReviews[i].Staff_Behavior]
            let insightScoreArr = locationReviews[i].Staff_Behavior_Score
            let insightMagnitudeArr = locationReviews[i].Staff_Behavior_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score: insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Staff_Behavior == "string" && locationReviews[i].Staff_Behavior && locationReviews[i].Staff_Behavior.toUpperCase() !="NULL" && locationReviews[i].Staff_Behavior.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Staff_Behavior,
                score: locationReviews[i].Staff_Behavior_Score,
                magnitude: locationReviews[i].Staff_Behavior_Magnitude
            }    
            entityDetails.push(insight)
        }

        // For wait time
        if(Array.isArray(locationReviews[i].Wait_Time) && locationReviews[i].Wait_Time.length>0){
            let insightArr = [...locationReviews[i].Wait_Time]
            let insightScoreArr = locationReviews[i].Wait_Time_Score
            let insightMagnitudeArr = locationReviews[i].Wait_Time_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Wait_Time == "string" && locationReviews[i].Wait_Time && locationReviews[i].Wait_Time.toUpperCase() !="NULL" && locationReviews[i].Wait_Time.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Wait_Time,
                score: locationReviews[i].Wait_Time_Score,
                magnitude: locationReviews[i].Wait_Time_Magnitude
            }    
            entityDetails.push(insight)
        }

        // For return intent
        if(Array.isArray(locationReviews[i].Return_Intent) && locationReviews[i].Return_Intent.length>0){
            let insightArr = [...locationReviews[i].Return_Intent]
            let insightScoreArr = locationReviews[i].Return_Intent_Score
            let insightMagnitudeArr = locationReviews[i].Return_Intent_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Return_Intent == "string" && locationReviews[i].Return_Intent && locationReviews[i].Return_Intent.toUpperCase() !="NULL" && locationReviews[i].Return_Intent.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Return_Intent,
                score: locationReviews[i].Return_Intent_Score,
                magnitude: locationReviews[i].Return_Intent_Magnitude
            }    
            entityDetails.push(insight)
        }

        // For cleanliness
        if(Array.isArray(locationReviews[i].Cleanliness) && locationReviews[i].Cleanliness.length>0){
            let insightArr = [...locationReviews[i].Cleanliness]
            let insightScoreArr = locationReviews[i].Cleanliness_Score
            let insightMagnitudeArr = locationReviews[i].Cleanliness_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Cleanliness == "string" && locationReviews[i].Cleanliness && locationReviews[i].Cleanliness.toUpperCase() !="NULL" && locationReviews[i].Cleanliness.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Cleanliness,
                score: locationReviews[i].Cleanliness_Score,
                magnitude: locationReviews[i].Cleanliness_Magnitude
            }    
            entityDetails.push(insight)
        }

        // For ambience
        if(Array.isArray(locationReviews[i].Ambience) && locationReviews[i].Ambience.length>0){
            let insightArr = [...locationReviews[i].Ambience]
            let insightScoreArr = locationReviews[i].Ambience_Score
            let insightMagnitudeArr = locationReviews[i].Ambience_Magnitude
            insightArr.forEach((ins,j)=>{
                if(typeof ins != "string")return;
                let insight = {
                    entity:ins,
                    score:Array.isArray(insightScoreArr) && insightScoreArr.length>0 && insightArr.length == insightScoreArr.length?insightScoreArr[j]:insightScoreArr,
                    magnitude: Array.isArray(insightMagnitudeArr) && insightMagnitudeArr.length>0 && insightArr.length == insightMagnitudeArr.length?insightMagnitudeArr[j]:insightMagnitudeArr
                }    
            entityDetails.push(insight)
            })
        }else if(typeof locationReviews[i].Ambience == "string" && locationReviews[i].Ambience && locationReviews[i].Ambience.toUpperCase() !="NULL" && locationReviews[i].Ambience.toUpperCase() !="N/A"){
            let insight = {
                entity:locationReviews[i].Ambience,
                score: locationReviews[i].Ambience_Score,
                magnitude: locationReviews[i].Ambience_Magnitude
            }    
            entityDetails.push(insight)
        }


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
                sentimentMagnitude: magnitude,
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

module.exports = { hotelPrompt,entityMapping }