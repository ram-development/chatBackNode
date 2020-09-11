const mongoose = require('mongoose');

const chatRoomSchema =  new mongoose.Schema({
    user1 : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    user2 : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    }
});

const ChatRooms = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = {ChatRooms};