const mongoose  = require('mongoose');

const messageSchema =  mongoose.Schema({
    chatId:{
        type: String,
        required: true,
    },
    senderId:{
        type: String,
        required: true,
    },
    message:{
        type: String,
        required: true,
    },
    createdAt:{
        type: Date,
        default: Date.now(),
        required: true
    }
});

module.exports  = mongoose.model("message", messageSchema);