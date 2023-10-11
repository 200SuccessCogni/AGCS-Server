const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    businessId:{
        type:mongoose.Schema.Types.ObjectId,
        require: [true,'Business id is required'],
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    employeeId:{
        type: String,
        required: [true, 'Employee Id is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/([a-zA-Z0-9]+[!#$%&*+=_{|}.-]?[a-zA-Z0-9]+)@([a-zA-Z0-9]+[!#$%^&*_=.-]?)[.]+[a-zA-Z0-9]{2,3}/, 'Enter a valid email'],
        uniqueCaseInsensitive: true
    },
    mobile: {
        type: Number,
        required: [true, 'Mobile is required'],
        unique: true, match: [/([6-9]{1})+([0-9]{9})/, 'Enter a valid mobile number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        match: [/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_+<>=.-]).{8,14}/, 'Enter a valid password']
    },
    permissionLevel:{
        type: Number,
        require:[true,'Pemission level is required']
    }
},{ timestamps: true })

// An employee id from an business should be unique
userSchema.index({ businessId:1,employeeId:1},{unique:true})
// Email id, mobile no should be unique
userSchema.index({ name: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ permissionLevel: 1 });
userSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });

const userModel = mongoose.model('user', userSchema, 'USERS')

module.exports = userModel;