const express = require('express');
const app = express();
const port = (process.env.port || 3000);
var server = app.listen(port);
var io = require('socket.io').listen(server);
const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const auth = require('./routes/auth');
const user = require('./routes/user');
const chat = require('./routes/chat').router;

var cors = require('cors');

io.set("origins", "*:*");

// exporting the socket file to be used in other routes
require('./routes/chat').chatService(io);

require('./service/chatRoom').socketService(io);

mongoose.connect('mongodb://localhost/chat_app', { useNewUrlParser : true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
    .then(() => { console.log('connected to chat_app');})
    .catch(() => { console.log('error while connecting to db');})

app.use(cors())

app.use(express.json());


app.use('/api/v1/user', user);
app.use('/api/v1/auth', auth);
app.use('/api/v1/chat', chat);

// app.listen(port, function(){
//     console.log(`Server started at ${port}...`);
// })