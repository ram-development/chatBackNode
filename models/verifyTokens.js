const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    token : {
        type : String,
        required : true
    },
    createdAt : {
        type : Date,
        required : true,
        default : Date.now
    }
})

const Tokens = mongoose.model('Token', tokenSchema);

module.exports = Tokens;