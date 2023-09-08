const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const reviewSourceSchema = mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'User id is required']
    },
    resortId: {
        type: String,
        required: [true, 'Resort id is required'],
    },
    sources: [{
        name: {type:String,required: [true, 'Name is required']},
        url: {type:String,required: [false]},
        headers: {type:String,required: [false]},
        queryParam: {type:String,required: [false]},
        payload: {type:String,required: [false]},
        partnerKey: {type:String,required: [false]},
        userName: {type:String,required: [false]},
        password: {type:String,required: [false]},
    }]
}, { timestamps: true })

reviewSourceSchema.index({ userId: 1, resortId:1,"sources.name": 1},{unique:true});
reviewSourceSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });

const reviewSourceModel = mongoose.model('reviewSource', reviewSourceSchema, 'REVIEWSOURCE')

module.exports = reviewSourceModel;