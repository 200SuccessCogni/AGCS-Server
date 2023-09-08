const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const reviewSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'User id is required']
    },
    resortId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Resort id is required']
    },
    resortName:{
        type: String,
        required: [true, 'Resort Id is required']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
    },
    state: {
        type: String,
        required: [false],
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
    },
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    desc: {
        type: String,
        required: [true, 'Description is required']
    },
    cusName:{
        type: String,
        required: [false]
    },
    cusCity:{
        type: String,
        required: [false]
    },
    cusState:{
        type: String,
        required: [false]
    },
    cusCountry:{
        type: String,
        required: [false]
    },
    source: {
        type: String,
        required: [true, 'Source is required']
    },
    rating: {
        type: Number,
        required: [false]
    },
    upVote: {
        type: Number,
        required: [false]
    },
    isSeen:{
        type: Boolean,
        default: false,
        required: [true,'isSeen is required']
    },
    isActioned: {
        type: Boolean,
        default: false,
        required: [false]
    },
    replyMessage: {
        type: String,
        required: [false]
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
        required: [true,'Sentiment magnitude is required']
    },
    date:{
        type: String,
        required: [true,'Date is required']
    }
},{timestamps:true});


// Creating unique compund index for resortName and location. This will ensure that for a resort from a city wont have the same text as description. But this compound index 
// will let documents to be added for the same resort from the same city with a different text or the same resort from a different city with the same text as description. Basically
// the compound index will prevent adding records which have similar values in the three fiels of resortName, city and description.
reviewSchema.index({ resortId: 1, desc: 1 },{unique:true});
reviewSchema.index({ userId:1,resortId: 1});
reviewSchema.index({ date:1});
reviewSchema.index({ rating:1});
reviewSchema.index({ source:1});
reviewSchema.index({ category:1});
reviewSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });
const reviewModel = mongoose.model('review', reviewSchema, 'REVIEW')

module.exports = reviewModel;