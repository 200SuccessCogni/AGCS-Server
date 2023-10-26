const express = require('express');
const cors = require('cors');
const { json, urlencoded, text } = require("body-parser");
const { HOST, PORT, NODE_ENV } = require('./process');
require("./src/utils/db");

// Routers
const businessRouter = require("./src/routes/business");
const userRouter = require("./src/routes/user");
const authRouter = require("./src/routes/auth");
const locationRouter = require("./src/routes/location");
const genTextRouter = require("./src/routes/generativeText")
const reviewRouter = require("./src/routes/review");
const entityRouter = require("./src/routes/entity");

console.log(process.env.NODE_ENV)

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Define all routes
// Business route is not publicly exposed
app.use('/api/v1.0', businessRouter); 
// User route is exposed only for admin of the business
app.use('/api/v1.0', userRouter);
// The below routes are exposed to the app
app.use('/api/v1.0', authRouter);
app.use('/api/v1.0', locationRouter);
app.use('/api/v1.0', reviewRouter)
app.use('/api/v1.0', genTextRouter);
app.use('/api/v1.0',entityRouter);

app.get('/', function (req, res) {
    res.send('Hello from server ❤️‍🔥');
})

// error handling middleware
app.use(function (err, req, res, next) {
    console.log(err)
    let error = {
        data: '',
        code: 4,
        msg: err
    }
    console.log(error);

    res.status(400).send(error);
})

const start = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server running on ${HOST} port: ${PORT}`);
        });
    } catch (e) {
        console.error(e);
    }
};

start();

