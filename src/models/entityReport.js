const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const entityReviewSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'User id is required']
    },
    resortId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Resort id is required']
    },
    reviewId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Review id is required']
    },
    source: {
        type: String,
        required: [true, 'Source is required']
    },
    entityScores: [{
        sentence: {
            type: String,
            required: [true, 'Sentence is required']
        },
        entityName: {
            type: String,
            required: [true, 'Entity Name is required']
        },
        sentimentScore: {
            type: Number,
            required: [true,'Sentiment score is required']
        },
        sentimentMagnitude: {
            type: Number,
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
        recommendation:{
            type: String,
            required: [false]
        }
    }],
    date:{
        type: String,
        required: [true,'Date is required']
    }
},{timestamps:true});


// Creating unique compund index for resortName and location. This will ensure that for a resort from a city wont have the same text as description. But this compound index 
// will let documents to be added for the same resort from the same city with a different text or the same resort from a different city with the same text as description. Basically
// the compound index will prevent adding records which have similar values in the three fiels of resortName, city and description.
entityReviewSchema.index({ reviewId: 1},{unique:true});
entityReviewSchema.index({ userId:1,resortId: 1});
entityReviewSchema.index({ entityName: 1});
entityReviewSchema.index({ date:1});
entityReviewSchema.index({ source:1});
entityReviewSchema.index({ category:1});
entityReviewSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });
const entityReviewModel = mongoose.model('entityReview', entityReviewSchema, 'ENTITYREVIEW')

module.exports = entityReviewModel;