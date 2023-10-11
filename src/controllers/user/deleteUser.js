const userModel = require('../../models/user');
const joi = require('joi');

const deleteUser = async (req, res, next) => {
    let reqPayload = req.body;

    let userId = {_id:reqPayload.userId?reqPayload.userId:''}

    let userObj = {
        userId:reqPayload.userId?reqPayload.userId:'',
    }

    const schema = joi.object({
        userId: joi.string().required(),
    })

    let result = schema.validate(userObj)

    if (result.error) {
        let errMsg = "Invalid user id";
        next(errMsg);
    } else {
        // Delete user document
        userModel.findOneAndDelete(userId)
            .then((business) => {
                if (business) {
                    let response = {
                        data: '',
                        code: 0,
                        msg: 'Success'
                    }
                    res.send(response)
                } else {
                    let errMsg = "Unable to delete user"
                    next(errMsg)
                }
            })
            .catch((err) => {
                if (err.path) {
                    errMsg = err.path ? err.path : 'Deleting user'
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

module.exports = { deleteUser }