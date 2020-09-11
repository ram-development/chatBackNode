const configModule = require('../config/config');
const jwt = require('jsonwebtoken');
const { Users } = require('../models/user');

module.exports = (() => {
    return async function  (req, res, next) {
        if (!req.headers['authorization']) {
            return res.status(401).send({ msg: 'Unauthorized User' });
        } else {
            if (req.headers['authorization'].startsWith('Bearer ')) {
                let token = req.headers['authorization'];
                token = token.slice(7, token.length);
                try {
                    let userId = jwt.verify(token, configModule.key)._id;

                    let user = await Users.findOne({ _id: userId });

                    if (!user) {
                        return res.status(401).send({ msg: 'Unauthorized User' });
                    }

                    req.user = user;
                    next();
                }
                catch (err) {
                    return res.status(401).send({ msg: 'Unauthorized User' });
                }
            } else {
                return res.status(401).send({ msg: 'Unauthorized User' });
            }
        }
    }
})