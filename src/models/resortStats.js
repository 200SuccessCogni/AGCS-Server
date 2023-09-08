const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const resortStatsSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'User id is required']
    },
    resortId:{
        type:mongoose.Schema.Types.ObjectId, 
        required:[true,'Resort id is required']
    },
    resortName: {
        type: String,
        required: [true, 'Resort Name is required'],
    },
    date: {
        type: String,
        required: [true, 'Date is required']
    },
    enquiries: {
        type: Number,
        required: [true, 'Enquiries count is required']
    },
    reservations: {
        type: String,
        required: [true, 'Reservations count is required']
    }
}, { timestamps: true })

// Creating unique compund index for resortName and location
resortStatsSchema.index({ userId:1,resortId: 1});
resortStatsSchema.index({ date: 1});
resortStatsSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });

const resortStatsModel = mongoose.model('resortStat', resortStatsSchema, 'RESORTSTATS')

module.exports = resortStatsModel;