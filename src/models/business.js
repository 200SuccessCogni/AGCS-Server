const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const businessSchema = mongoose.Schema({
    name: {
        type: String,
        required:[true,'Business name is required']
    },
    originCountry: {
        type: String,
        required:[true,'Country of origin is required']
    },
    address:{
        type: String,
        required:[true,'Address is required']
    },
    uid:{
        type: String,
        required:[true,'Unique id is required']
    },
    useNlp:{
        type: Boolean,
        required: [true,'Analyzer type is required'],
        default: true
    },
    domain:{
        type: String,
        required:[false]
    },
    webUrl:{
        type: String,
        required:[false]
    },
},{timestamps:true});

// The combination of country of origin and the unique business identifier should be unique for a business.
businessSchema.index({ originCountry: 1,uid:1},{unique:true});
businessSchema.index({ name: 1});
businessSchema.index({ name: 1,originCountry: 1});
businessSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });
const businessModel = mongoose.model('business', businessSchema, 'BUSINESSES')

module.exports = businessModel;