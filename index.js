const express = require('express');
const cors = require('cors');
const { json, urlencoded, text } = require("body-parser");
const { HOST, PORT, NODE_ENV } = require('./process');
const verifyToken = require("./src/controllers/auth");
require("./src/utils/db");
require("./src/utils/cron");

// Routers
const authRouter = require("./src/routes/auth");
const reviewRouter = require("./src/routes/review");
const resortRouter = require("./src/routes/resort");

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Define all routes
app.use('/api/v1.0', authRouter);
app.use('/api/v1.0', reviewRouter)
app.use('/api/v1.0', resortRouter)
// app.use('/api/v1.0',verifyToken.verifyToken, reviewRouter);

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
            console.log(`Server running on port: ${PORT}`);
        });
    } catch (e) {
        console.error(e);
    }
};

start();

// app.listen(PORT, function () {
//     console.log(`Server running on ${HOST}:${PORT}`)
// })

