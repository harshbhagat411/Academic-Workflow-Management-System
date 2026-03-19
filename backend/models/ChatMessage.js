const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatMessageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        default: uuidv4,
        unique: true
    },
    chatRoomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        required: true,
        enum: ['Student', 'Faculty']
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
