const mongoose = require('mongoose');
const {
  DBUserName: username,
  DBPassword: password,
  DBCluster: cluster,
  DBName: dbname
} = require('../../process');


const dbUrl = `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`;
console.log({ dbUrl })
const options = { autoIndex: true, useNewUrlParser: true, useUnifiedTopology: true }
// const connect = (url = dbUrl, opts = {}) => {
//     return mongoose.connect(url, { ...opts, useNewUrlParser: true });
// };

// module.exports = connect;

mongoose.connect(dbUrl, options).then((res) => {
  console.log('Mongodb is connected')
}).catch((err) => {
  console.log(`Mongodb connection failed with error ${err}`)
});


mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open to ' + dbUrl);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {

  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
}); 