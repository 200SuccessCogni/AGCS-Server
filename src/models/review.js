const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const reviewSchema = mongoose.Schema({
    businessId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Business id is required']
    },
    locationId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Location id is required']
    },
    sourceReviewId:{
        type: String,
        required: [false]
    },
    rating: {
        type: Number,
        required: [false]
    },
    title: {
        type: String,
        required: [false]
    },
    desc: {
        type: String,
        required: [true, 'Description is required']
    },
    desc_embedding:{
        type: Array,
        required: [false],
        default: []
    },
    locationName:{
        type: String,
        required: [true, 'Location Name is required']
    },
    address:{
        type: String,
        required: [true,'Address is required']
    },
    city: {
        type: String,
        required: [false],
    },
    state: {
        type: String,
        required: [false],
    },
    country: {
        type: String,
        required: [false],
    },
    source: {
        type: String,
        required: [true, 'Source is required']
    },
    date:{
        type: String,
        required: [true,'Date is required']
    },
    upVote: {
        type: Number,
        required: [false]
    },
    isSeen:{
        type: Boolean,
        default: false,
        required: [false]
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
        required: [false]
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
    useNlp:{
        type:Boolean,
        required:[true,'useNlp is required']
    }
},{timestamps:true});


// Creating unique compund index for businessId, locationId and source review id. This will ensure that a brand won't have duplicate reviews.

reviewSchema.index({ businessId: 1, locationId: 1, address:1, desc:1 },{unique:true});
reviewSchema.index({ businessId: 1});
reviewSchema.index({ locationId: 1});
reviewSchema.index({ category:1});
reviewSchema.index({ date:1});
reviewSchema.index({ rating:1});
reviewSchema.index({ source:1});
reviewSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });
const reviewModel = mongoose.model('review', reviewSchema, 'REVIEWS')

module.exports = reviewModel;