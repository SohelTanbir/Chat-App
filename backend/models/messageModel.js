const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    chatId: {
        type: String,
        required: true,
    },
    senderId: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        default: '',
        trim: true,
    },
    isSeen: {
        type: Boolean,
        default: false,
    },
    seenAt: {
        type: Date,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text',
    },
    fileUrl: {
        type: String,
        default: '',
    },
    fileName: {
        type: String,
        default: '',
    },
    fileSize: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    }
});

module.exports = mongoose.model("message", messageSchema);