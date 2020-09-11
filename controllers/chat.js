const { Users } = require('../models/user');
const { ChatRooms } = require('../models/chatRoom');
const { Messages } = require('../models/messages');
const Cryptr = require('cryptr');
const Joi = require('joi');
var _ = require('lodash');
const configModule = require('../config/config');
const cryptr = new Cryptr(configModule.key);
// var io = require('socket.io')
const chatService = require('../service/chatRoom');

exports.search = async (req, res) => {
    const name = req.query.name;

    if (!name) {
        return res.status(422).send({ msg: 'Name is required' });
    }

    const usersRecord = await Users.find({ name: { $regex: name, $options: 'i' }, confirmed: true });

    return res.status(200).send({ data: (_.map(usersRecord, o => _.pick(o, ['name', 'email', 'contact', '_id']))) });
}

exports.newMessage = function(io){
    var that = {};

    const _io = io;

    that.saveMsg = async (req, res) => {
       if (req.body) {
    
           const { error } = checkNewMsg(req.body);
    
           if (error) {
               return res.status(422).send({ msg: error.details[0].message })
           }
    
           try {
    
               if (req.body.receiver == req.user._id) {
                   return res.status(400).send({ msg: "Sender and receiver cannot be same" });
               }
    
               let receiverUser = await Users.findById(req.body.receiver);
               let convRoom = {};
               const loggedInUserChats = await ChatRooms.find({ $or: [{ user1: req.user._id }, { user2: req.user._id }] });
    
               if (loggedInUserChats.length) {
                   loggedInUserChats.forEach((ele) => {
                       if ((ele.user1 == req.body.receiver) || (ele.user2 == req.body.receiver)) {
                           convRoom = ele;
                       }
                   })
               }
    
               if (Object.keys(convRoom).length === 0 && convRoom.constructor === Object) {
                   convRoom = new ChatRooms({ user1: req.user._id, user2: receiverUser });
                   convRoom = await convRoom.save();
                   let msg = {
                       chatRoomId: convRoom._id,
                       messages: [
                           {
                               sender: req.user._id,
                               msg: cryptr.encrypt(req.body.msg)
                           }
                       ]
                   }
                   newMsg = new Messages(msg);
                   await newMsg.save();
               }
               else {
                   let msg = {
                       sender: req.user._id,
                       msg: cryptr.encrypt(req.body.msg)
                   }
                   let newMsg = await Messages.findOneAndUpdate({ chatRoomId: convRoom._id }, { $push: { messages: msg } }, { new: true });
                   console.log(newMsg);
               }
               if(chatService.connectedUsers[req.body.receiver]){
                   _io.to(chatService.connectedUsers[req.body.receiver]).emit('msg', { data: req.body.msg });
               }
    
    
               return res.status(200).send({ msg: 'Message saved successfully' });
           }
           catch (ex) {
               return res.status(400).send({ "msg": "User not found" });
           }
    
       }
       else {
           return res.status(422).send({ msg: 'Enter all data' });
       }
    }

    return that;
}

exports.getMessage = async (req, res) => {

    try {
        if(req.user._id == req.params.receiverId ){
            return res.status(409).send({msg : 'Sender and receiver cannot be same'})
        }
        let convRoom = {};
        const loggedInUserChats = await ChatRooms.find({ $or: [{ user1: req.user._id }, { user2: req.user._id }] });

        if (loggedInUserChats.length) {
            loggedInUserChats.forEach((ele) => {
                if ((ele.user1 == req.params.receiverId) || (ele.user2 == req.params.receiverId)) {
                    convRoom = ele;
                }
            })
        }

        if (Object.keys(convRoom).length === 0 && convRoom.constructor === Object) {
            let data = {
                messages: [],
                total: 0
            }
            return res.status(200).send({ data: data });
        }
        else {
            let perPage = 5;
            let page = 1;
            if ((req.query.page) && (req.query.page > 0)) {
                page = req.query.page;
            }
            if (req.query.perPage) {
                perPage = req.query.perPage;
            }
            let msg = await Messages.aggregate([
                {
                    $unwind: '$messages'
                },
                {
                    $sort: {
                        'messages._id': -1
                    }
                },
                {
                    $match: {
                        'chatRoomId': convRoom._id
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        'chatRoomId': { '$first': '$chatRoomId' },
                        'updateMsg': {
                            $push: '$messages'
                        },
                        'total': {
                            $sum: 1
                        }
                    }
                },
                {
                    $project: {
                        chatRoomId: '$chatRoomId',
                        messages: {
                            $slice: ['$updateMsg', ((page - 1) * perPage), parseInt(perPage)]
                        },
                        total: "$total"
                    }
                }
            ])
            if(msg.length){
                msg[0].messages.map(ele => ele.msg = cryptr.decrypt(ele.msg));
            }
            return res.status(200).send({ data: msg[0] });
        }

    }
    catch (ex) {
        console.log(ex)
        res.status(404).send({ msg: 'User not found' });
    }
}

exports.connectedUsers = async (req, res) => {
    try {
        let perPage = 5;
        let page = 1;
        if ((req.query.page) && (req.query.page > 0)) {
            page = req.query.page;
        }
        if ((req.query.perPage) && (req.query.perPage <= 25)) {
            perPage = req.query.perPage;
        }

        const loggedInUserChats = await ChatRooms.find({ $or: [{ user1: req.user._id }, { user2: req.user._id }] }).skip((page - 1) * perPage).limit(perPage);
        let arr = loggedInUserChats.map(ele => { return (ele.user1 == req.user.id) ? ele.user2 : ele.user1;
        });
        let usersRecord = await Users.find({ "_id": { $in: arr } });
        res.send({ data: (_.map(usersRecord, o => _.pick(o, ['name', 'email', 'contact', '_id']))) });
    }
    catch (ex) {
        console.log(ex);
        res.status(404).send({ msg: 'User not found' });
    }
}

function checkNewMsg(reqBody) {
    const schema = Joi.object().keys({
        msg: Joi.string().required(),
        receiver: Joi.string().required()
    })

    return Joi.validate(reqBody, schema);
}