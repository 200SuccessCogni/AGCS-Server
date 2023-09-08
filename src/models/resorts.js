const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const resortsSchema = mongoose.Schema({
    resortName: {
        type: String,
        required: [true, 'Name is required']
    },
    address: {
        type: String,
        required: [false],
    },
    city: {
        type: String,
        required: [true, 'City is required']
    },
    state: {
        type: String,
        required: [true, 'State is required']
    },
    country: {
        type: String,
        required: [true, 'Country is required']
    },
    organization:{
        type: String,
        required: [true, 'Organization is required'],
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'User id is required']
    }
}, { timestamps: true })

resortsSchema.index({ resortName: 1, city:1},{unique:true});
resortsSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });

const resortModel = mongoose.model('resort', resortsSchema, 'RESORTS')

module.exports = resortModel;