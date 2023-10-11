const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const locationSchema = mongoose.Schema({
    businessId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Business id is required']
    },
    locationName:{
        type: String,
        required:[true,'Location name required']
    },
    city:{
        type:String,
        required:[true,'City is required']
    },
    state:{
        type:String,
        required:[true,'State is required']
    },
    country:{
        type:String,
        required:[true,'Country is required']
    },
    address:{
        type:String,
        required:[true,'Location address is required']
    },
    source: {
        type: String,
        required:[false]
    },
    url:{
        type: String,
        required:[false]
    },
    accountId:{
        type: String,
        required:[false]
    },
    sourceLocationId:{
        type:String,
        required:[false]
    },
    hashtags:[{
            type: String,
            required:[false]
    }]
},{timestamps:true});

// A business has to assign a unique name and address for every location per city

locationSchema.index({businessId:1,locationName:1,city:1,address:1},{unique:true})
locationSchema.index({ businessId: 1});
locationSchema.index({ locationName: 1});
locationSchema.index({ city: 1});
locationSchema.index({ address: 1});
locationSchema.index({ source: 1});
locationSchema.index({ tagName: 1});
locationSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });
const locationModel = mongoose.model('LOCATION', locationSchema, 'LOCATIONS')

module.exports = locationModel;