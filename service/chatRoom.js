const configModule = require('../config/config');
const jwt = require('jsonwebtoken');
const { Users } = require('../models/user');

let connectedUsers = {};
module.exports.socketService = function (io) {
    io.on('connection', (socket) => {
        // console.log('connected:', socket);

        socket.on('online', async (data) => {
            try{
                var userId = jwt.verify(data, configModule.key)._id;
                let user = await Users.findOne({ _id: userId });
                if(user){
                    if (connectedUsers[data]) {
                        delete connectedUsers[data];
                    }
                    connectedUsers[userId] = socket.id;
                }
            }
            catch(ex){
                console.log(ex);
            }

        })

        var srvSockets = io.sockets.sockets;
        // console.log('count:', Object.keys(srvSockets).length);
        // socket.on()
        socket.on('disconnect', () => {
            console.log('disonnected');
            for(const userID in connectedUsers){
                if((connectedUsers[userID]) && (connectedUsers[userID] == socket.id)){
                    delete connectedUsers[userID];
                }
            }
            var newsrvSockets = io.sockets.sockets;

            // console.log('count:', Object.keys(newsrvSockets).length);
            // console.log('socketArr:', connectedUsers);
        })
    })
}

module.exports.connectedUsers = connectedUsers;