const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const sourceSchema = mongoose.Schema({
    businessId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Business id is required']
    },
    locationId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Location id is required']
    },
    prompts:[{
        title:{
            type:String,
            required:[true,'Title is required']
        }
    }]
},{timestamps:true});


promptSchema.index({ businessId: 1,locationId:1},{unique:true});
promptSchema.index({ locationId: 1});
promptSchema.index({ source: 1});
promptSchema.index({ title: 1});
promptSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });
const promptSchemaModel = mongoose.model('prompt', promptSchema, 'PROMPTS')

module.exports = promptSchemaModel;