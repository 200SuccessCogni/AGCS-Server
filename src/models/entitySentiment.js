const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const entitySentimentSchema = mongoose.Schema({
    businessId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Business id is required']
    },
    locationId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Location id is required']
    },
    desc:{
        type: String,
        required:[true,'Desc is required']        
    },
    // reviewId:{
    //     type:mongoose.Schema.Types.ObjectId, 
    //     required:[true,'Review id is required']
    // },
    source: {
        type: String,
        required: [true, 'Source is required']
    },
    sourceReviewId:{
        type: String,
        required: [false]
    },
    entityScores: [{
        entityName: {
            type: String,
            required: [true, 'Entity Name is required']
        },
        sentimentScore:{
            type:Number,
            required: [true,'Sentiment score is required']
        },
        sentimentMagnitude:{
            type:Number,
            required: [true,'Sentiment magnitude is required']
        },
        category:{
            type: String,
            required: [true,'Category is required']
        },
        actionItem:{
            type: String,
            required: [false]
        },
        date:{
            type: String,
            required: [true,'Date is required']
        }
    }]
},{timestamps:true});


// Review id should be unique
entitySentimentSchema.index({ businessId: 1});
entitySentimentSchema.index({ locationId: 1});
entitySentimentSchema.index({ entityName: 1});
entitySentimentSchema.index({ date:1});
entitySentimentSchema.index({ source:1});
entitySentimentSchema.index({ category:1});
entitySentimentSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });
const entitySentimentModel = mongoose.model('entitySentiment', entitySentimentSchema, 'ENTITYSENTIMENTS')

module.exports = entitySentimentModel;