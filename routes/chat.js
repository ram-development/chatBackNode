const express = require('express');
var authorization = require('../middlewares/authorization');
var chatController = require('../controllers/chat');
const router = express.Router();

module.exports.chatService = function(io) {
    router.get('/search', [authorization()], chatController.search);
    router.get('/message/:receiverId', [authorization()], chatController.getMessage);
    router.get('/connectedUsers', [authorization()], chatController.connectedUsers);
    router.post('/newMessage', [authorization()], chatController.newMessage(io).saveMsg);
}

module.exports.router = router;
