const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatRoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        default: uuidv4,
        unique: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    guideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure one chat room per student-guide pair
chatRoomSchema.index({ studentId: 1, guideId: 1 }, { unique: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
