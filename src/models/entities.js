const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const entitySchema = mongoose.Schema({
    businessId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Business id is required']
    },
    entities:[{
            type:String,
            required:[true,"Entity is required"]
    }]
},{timestamps:true});


entitySchema.index({ businessId: 1,entities:1},{unique:true});
entitySchema.plugin(uniqueValidator, { message: '{PATH} already exists' });
const entitySchemaModel = mongoose.model('entity', entitySchema, 'ENTITIES')

module.exports = entitySchemaModel;