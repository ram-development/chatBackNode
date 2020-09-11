const bcrypt = require('bcrypt');
const Joi = require('joi');
const { Users } = require('../models/user');
const jwt = require('jsonwebtoken');
const configModule = require('../config/config');

exports.login = async(req, res) => {
    if(req.body){
        const { error } = validate(req.body);
        
        if(error){
            return res.status(422).send({msg : error.details[0].message});
        }

        const user = await Users.findOne({ email : req.body.email });

        if(!user){
            return res.status(422).send({msg :'Incorrect Email or Password'});
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);

        if(!validPassword){
            return res.status(400).send({msg : 'Incorrect Email or Password'});
        }

        if(!user.confirmed){
            return res.status(400).send({msg : 'Email is not verified'})
        }

        const token = jwt.sign({_id: user._id, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2)}, configModule.key);

        return res.status(200).send({ token })
        
    }
    else{
        return res.status(422).send({msg : 'Enter all data'});
    }
} 

function validate(reqBody){
    const schema = Joi.object().keys({
        email : Joi.string().email().required(),
        password : Joi.string().required()
    })

    return Joi.validate(reqBody, schema);
}