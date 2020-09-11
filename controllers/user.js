const bcrypt = require('bcrypt');
const { Users, validate } = require('../models/user');
const Joi = require('joi');
const Tokens = require('../models/verifyTokens');
var _ = require('lodash');
const jwt = require('jsonwebtoken');
var sendMail = require('../service/sendEmail');
const configModule = require('../config/config');

exports.register = async (req, res) => {
    if (req.body) {
        const { error } = validate(req.body);

        if (error) {
            return res.status(422).send( {msg : error.details[0].message} );
        }

        let user = await Users.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).send({ msg: 'User already exists' });
        }

        user = new Users(req.body);

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        try {
            const newUser = await user.save();
            var token = new Tokens({ token: jwt.sign({ _id: newUser._id, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2) }, configModule.key) });
            token = await token.save();
            let link = req.get('origin') + "/verify/" + token.token;
            mailOptions = {
                from: "navneet.jha@mail.vinove.com",
                to: req.body.email,
                subject: "Please confirm your Email account",
                html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a><br>Link will expire in 2 hours."
            }
            sendMail(mailOptions)
            return res.status(200).send({ user: (_.pick(user, ['name', 'email', 'contact'])), msg: 'Verification Mail Sent' });
        }
        catch (ex) {
            console.log(ex);

            return res.status(500).send({ msg: 'Exception Occured' });
        }
    }
    else {
        return res.status(422).send({ msg: 'Enter all data' });
    }
}

exports.verifyUser = async (req, res) => {
    let token = await Tokens.findOne({ token: req.params.tokenId });

    if (!token) {
        return res.status(422).send({ msg: 'Token has expired' });
    }

    try {
        var userId = jwt.verify(token.token, configModule.key)._id;

        let user = await Users.findOne({ _id: userId })

        if (!user) {
            return res.status(404).send({ msg: 'No such user exist' });
        }

        user.confirmed = true;
        try {
            await user.save();
            await Tokens.deleteOne({ _id: token._id });
            return res.status(200).send({ msg: 'User verified successfully' });
        }
        catch (ex) {
            console.log('err', ex);
            return res.status(500).send({ msg: 'Exception Occured' });
        }
    }
    catch (err) {
        await Tokens.deleteOne({ _id: token._id });
        return res.status(422).send({ msg: 'Token has expired' });
    }


}

exports.resendVerify = async (req, res) => {
    if (req.body) {
        const { error } = resendValidate(req.body);

        if (error) {
            return res.status(422).send(error.details[0].message);
        }

        const user = await Users.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).send({ msg: 'User does not exist' });
        }

        if (user.confirmed) {
            return res.status(400).send({ msg: "User is already confirmed" });
        }

        var token = new Tokens({ token: jwt.sign({ _id: user._id, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2) }, configModule.key) });
        try {
            token = await token.save();
            let link = req.get('origin') + "/verify/" + token.token;
            mailOptions = {
                from: "navneet.jha@mail.vinove.com",
                to: req.body.email,
                subject: "Please confirm your Email account",
                html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a><br>Link will expire in 2 hours."
            }
            sendMail(mailOptions);
            return res.status(200).send({ msg: 'Verification Mail Sent' });
        }
        catch (ex) {
            console.log(ex);
            return res.status(500).send({ msg: 'Exception Occured' });
        }


    }
}

exports.forgotPassword = async (req, res) => {
    if (req.body) {

        const { error } = resendValidate(req.body);

        if (error) {
            return res.status(422).send(error.details[0].message);
        }

        const user = await Users.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).send({ msg: "User does not exist" });
        }

        var token = new Tokens({ token: jwt.sign({ _id: user._id, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2) }, configModule.key) });

        try {
            token = await token.save();
            let link = req.get('origin') + "/resetPassword/" + token.token;
            mailOptions = {
                from: "navneet.jha@mail.vinove.com",
                to: req.body.email,
                subject: "Password Reset Mail",
                html: "Hello,<br> Please Click on the link to reset your password.<br><a href=" + link + ">Click here. </a><br>Link will expire in 2 hours."
            }
            sendMail(mailOptions);
            return res.status(200).send({ msg: 'Password reset mail sent' });
        }
        catch (ex) {
            console.log(ex);
            return res.status(500).send({ msg: 'Exception Occured' });
        }

    }
}

exports.verifyForgot = async (req, res) => {
    let token = await Tokens.findOne({ token: req.params.tokenId });

    if (!token) {
        return res.status(422).send({ msg: 'Token has expired' });
    }

    try {
        var userId = jwt.verify(token.token, configModule.key)._id;

        let user = await Users.findOne({ _id: userId });

        if (!user) {
            return res.status(404).send({ msg: 'No such user exist' });
        }

        return res.status(200).send({ msg: 'Token verified successfully' });
    }
    catch (err) {
        await Tokens.deleteOne({ _id: token._id });
        return res.status(422).send({ msg: 'Token has expired' });
    }
}

exports.resetPassword = async (req, res) => {
    if (req.body) {

        const { error } = resetValidate(req.body);

        if (error) {
            return res.status(422).send({msg : error.details[0].message});
        }

        let token = await Tokens.findOne({ token: req.body.token });

        if (!token) {
            return res.status(422).send({ msg: 'Token has expired' });
        }

        try {
            var userId = jwt.verify(token.token, configModule.key)._id;

            let user = await Users.findOne({ _id: userId });

            if (!user) {
                return res.status(404).send({ msg: 'No such user exist' });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);

            try {
                await user.save();
                await Tokens.deleteOne({ _id: token._id });
                return res.status(200).send({ msg: 'Password Changed Successfully' });
            }
            catch (ex) {
                console.log('err', ex);
                return res.status(500).send({ msg: 'Exception Occured' });
            }

        }
        catch (err) {
            await Tokens.deleteOne({ _id: token._id });
            return res.status(422).send({ msg: "Token has expired" });
        }

    }
}

exports.userProfile = async (req, res) => {
    return res.status(200).send(_.pick(req.user, ['name', 'email', 'contact']));
}

function resendValidate(reqBody) {
    const schema = Joi.object().keys({
        email: Joi.string().email().required()
    })

    return Joi.validate(reqBody, schema);
}

function resetValidate(reqBody) {
    const schema = Joi.object().keys({
        password: Joi.string().required().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
        confirmPassword : Joi.string().required().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).valid(Joi.ref('password')),
        token: Joi.string().required()
    })

    return Joi.validate(reqBody, schema);
}