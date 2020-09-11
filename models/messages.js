const mongoose = require('mongoose');
const { required } = require('joi');

const messageSchema =  new mongoose.Schema({
    chatRoomId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'ChatRoom',
        required : true
    },
    messages : [
        {
            createdAt : {
                type : Number,
                required : true,
                default : Number(new Date())
            },
            sender : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'User',
                required : true
            },
            msg : {
                type : String,
                required : true
            },
            seen : {
                type : Boolean,
                required : true,
                default : false
            }
        }
    ]
});

const Messages = mongoose.model('message', messageSchema);

module.exports = {Messages};