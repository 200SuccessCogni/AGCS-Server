
const jwt = require('jsonwebtoken');
const { JWT_User } = require('../../../process');

// Token authentication
const verifyToken = (req, res, next) => {
    if (!req.headers.authorization) {

        error = {
            data: '',
            code: 4,
            msg: 'Unauthorized request'
        }
        return res.status(401).send(error)
    }

    let token = req.headers.authorization.split(' ')[1]

    if (token === 'null') {
        error = {
            data: '',
            code: 4,
            msg: 'Unauthorized request'
        }
        return res.status(401).send(error)
    }

    let payload = jwt.verify(token, JWT_User)

    if (!payload) {
        error = {
            data: '',
            code: 4,
            msg: 'Unauthorized request'
        }
        return res.status(401).send(error)
    }

    req.userId = payload.payload
    next()
}

module.exports = { verifyToken }