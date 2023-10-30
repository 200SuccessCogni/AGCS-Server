const dotenv = require('dotenv');
const path = require('path');

// dotenv.config({
//     path: path.resolve(__dirname, `./environments/${process.env.NODE_ENV}.env`)
// });

dotenv.config({
    path: path.join(__dirname, `.env`)
});

module.exports = {
    NODE_ENV: process.env.NODE_ENV,
    HOST: process.env.HOST,
    PORT: process.env.PORT,
    DB: process.env.DB,
    DBUrl: process.env.DBUrl,
    DBUserName: process.env.DBUserName,
    DBPassword: process.env.DBPassword,
    DBCluster: process.env.DBCluster,
    DBName: process.env.DBName,
    JWT_User : process.env.JWT_User,
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
    OPEN_AI_RESOURCE_NAME: process.env.OPEN_AI_RESOURCE_NAME,
    OPEN_AI_DEPLOYMENT_NAME: process.env.OPEN_AI_DEPLOYMENT_NAME
}