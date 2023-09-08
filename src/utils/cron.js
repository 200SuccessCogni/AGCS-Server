var cron = require('node-cron');

var minuteTask = cron.schedule('*/5 * * * * *',()=>{
    var timeNow = new Date();
    console.log('Hello',timeNow)
})

minuteTask.start();

module.exports =  { minuteTask };
