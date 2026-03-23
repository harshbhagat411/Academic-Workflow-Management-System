const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    themeMode: { 
        type: String, 
        default: 'system' // 'default' or 'system'
    },
    colorMode: {
        type: String,
        default: 'dark' // 'dark' or 'light'
    },
    emailNotifications: { 
        type: Boolean, 
        default: true 
    },
    marksNotifications: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
