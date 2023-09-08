const resortModel = require('../models/resorts');
const resortStats = require('../models/resortStats');
const joi = require('joi');
const fs = require("fs");
const mongoose = require('mongoose');

// Create Resort
const createResort = (req, res, next) => {
    let reqPayload = req.body;

    let resortObj = {
        resortName: reqPayload.resortName ? reqPayload.resortName : '',
        address: reqPayload.address ? reqPayload.address : '',
        city: reqPayload.city ? reqPayload.city : '',
        state: reqPayload.state? reqPayload.state: '',
        country: reqPayload.country? reqPayload.country: '',
        organization: reqPayload.organization ? reqPayload.organization : '',
        userId: req.userId?req.userId:reqPayload.userId? reqPayload.userId :''
    }

    const schema = joi.object({
        resortName: joi.string().required(),
        address: joi.string().allow(''),
        city: joi.string().required(),
        state: joi.string().required(),
        country: joi.string().required(),
        organization: joi.string().required(),
        userId: joi.string().required()
    })

    let result = schema.validate(resortObj)

    if (result.error) {
        console.log(result.error)
        let errMsg = "Invalid resort details";
        next(errMsg);
    } else {
        // Create user document
        resortModel.create(resortObj)
            .then((resort) => {
                if (resort) {
                    let response = {
                        data: '',
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to create resort"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Creating resort'
                    next('Error in ' + errMsg)
                } else if (err.errors) {
                    let message = err.toString().split(":");
                    let errMsg = message[2].split(",");
                    next(errMsg[0])
                } else {
                    next(err)
                }
            })
    }
}


// Get all resort by userid
const getResort = async (req, res, next) => {
    // Checks resorts collection for matching user id
    resortModel.find({ userId: req.userId })
        .then((resort) => {
            let response = "";
            if (resort) {
                response = {
                    data: resort,
                    code: 0,
                    msg: 'Success'
                }
                res.send(response)
            } else {
                let errMsg = "Unable to find any resorts"
                next(errMsg)
            }


        }).then()
        .catch((err) => {
            if (err.path) {
                errMsg = err.path ? err.path : 'Fetching resorts'
                next('Error in ' + errMsg)
            } else if (err.errors) {
                let message = err.toString().split(":");
                let errMsg = message[2].split(",");
                next(errMsg[0])
            } else {
                next(err)
            }
        })
}


// Get resort by id
const getResortById = async (req, res, next) => {
    let reqPayload = req.body

    const schema = joi.object({
        userId: joi.string().required(),
    })

    let result = schema.validate(reqPayload);

    if (result.error) {
        let errMsg = "Invalid user";
        next(errMsg)
    } else {
        // Checks resorts collection for matching user id and resortid
        resortModel.findOne({ userId: req.userId,resortId: req.query.resortId})
            .then((resort) => {
                let response = "";
                if (resort) {
                    response = {
                        data: resort,
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to find any resorts"
                    next(errMsg)
                }


            }).then()
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Fetching resorts'
                    next('Error in ' + errMsg)
                } else if (err.errors) {
                    let message = err.toString().split(":");
                    let errMsg = message[2].split(",");
                    next(errMsg[0])
                } else {
                    next(err)
                }
            })
    }
}


// Middleware for fetching resort stats from third party websites(presently dummy data)
const fetchStats = async(req,res,next) =>{
    console.log('Fetch started')
    let url = ''
    if(req.userId = "649bf0f508c96b1fae7f215f"){
        if(req.query.resortId = "649da34e953f4d5cdeaff1bb"){
            url = './dummy/resort1Stats.json' 
        }else if(req.query.resortId = "649da3f7953f4d5cdeaff1c1"){
            url = './dummy/resort2.json'
        }
    }else if(req.userId = "649bf0f508c96b1fae7f215f"){
        if(req.query.resortId = "649da34e953f4d5cdeaff1bb"){
            url = './dummy/hotel2.json'
        }
    }
    console.log(url)
    fs.readFile(url, "utf8", (err, jsonString) => {
        if (err) {
          next("File read failed:", err);
          return;
        }
        console.log('Json read')
        let jsonRes = JSON.parse(jsonString);
        req.body = [...jsonRes];
        next();
      });
}


// Add resort stats
const addStats = (req, res, next) => {

    let resortStatArr = [...req.body]
    let statArr = [];
    let statErrArr = [];

    const schema = joi.object({
        userId: joi.string().required(),
        resortId: joi.string().allow(''),
        resortName: joi.string().required(),
        date: joi.string().required(),
        enquiries: joi.string().required(),
        reservations: joi.string().required(),
    })

    resortStatArr.forEach((stat)=>{
        const reviewObj = {
            userId: req.userId ? req.userId : '',
            resortId: req.query.resortId ? req.query.resortId : '',
            resortName: stat.resortName ? stat.resortName : '',
            date: stat.date? stat.date: '',
            enquiries: stat.enquiries? stat.enquiries: '',
            reservations: stat.reservations ? stat.reservations : '',
        }

        // Check the format of each review
        let result = schema.validate(reviewObj)
        if (result.error) {
            statErrArr.push(reviewObj);
        } else {
            statArr.push(reviewObj);
        }
    })

    if (statArr.length>0) {
        // Create resort stats document
        resortStats.insertMany(statArr,{ordered:false})
            .then((resort) => {
                if (resort) {
                    let response = {
                        data: '',
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to create resort"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Creating resort'
                    next('Error in ' + errMsg)
                } else if (err.errors) {
                    let message = err.toString().split(":");
                    let errMsg = message[2].split(",");
                    next(errMsg[0])
                } else {
                    next(err)
                }
            })
    }
}

// Get resort stats
const getStats = (req,res,next)=>{
    let startDate = req.query.startDate?req.query.startDate:'';
    let endDate = req.query.endDate?req.query.endDate:'';

    let filterValidationObj = {
        userId: req.userId?req.userId:'',
        resortId: req.query.resortId?req.query.resortId:'',
        startDate: startDate,
        endDate: endDate        
    }

    let filter = {
        userId: req.userId?new mongoose.Types.ObjectId(req.userId):'',
        resortId: req.query.resortId?new mongoose.Types.ObjectId(req.query.resortId):'',
        date : {
            $gte: startDate, 
            $lt: endDate
        }
    }

    const schema = joi.object({
        userId: joi.string().required(),
        resortId: joi.string().required(),
        startDate: joi.string().required(),
        endDate: joi.string().required(),
    })

    let result = schema.validate(filterValidationObj);

    if (result.error) {
        console.log(result.error)
        let errMsg = "Invalid request";
        next(errMsg)
    } else {
        console.log(filter);
        resortStats.aggregate([
            {$match:filter}
        ]).exec().then((doc)=>{
            let response = {
                data: doc,
                code: 0,
                msg: 'Success'
            }
            res.send(response)
        }).catch((err)=>{
            errMsg = 'Error in fetching review'
            next(errMsg)
        });
    }

}



module.exports = {createResort, getResort, getResortById, fetchStats ,addStats,getStats}