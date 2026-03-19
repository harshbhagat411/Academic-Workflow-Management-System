const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const MentorAllocation = require('../models/MentorAllocation');
const User = require('../models/User');
const { decrypt } = require('../utils/encryption');

exports.getChatRoom = async (req, res) => {
    try {
        const { role, _id } = req.user;
        let studentId, guideId;

        // Determine student and guide IDs based on requester role
        if (role === 'Student') {
            studentId = _id;
            // Find assigned mentor
            const allocation = await MentorAllocation.findOne({ studentId, isActive: true });
            if (!allocation) {
                return res.status(404).json({ message: 'No mentor assigned yet.' });
            }
            guideId = allocation.facultyId;
        } else if (role === 'Faculty') {
            guideId = _id;
            studentId = req.query.studentId; // Faculty must request with specific student ID
            if (!studentId) {
                return res.status(400).json({ message: 'Student ID is required.' });
            }
        } else {
            return res.status(403).json({ message: 'Unauthorized access to chat.' });
        }

        // Find or create room
        let chatRoom = await ChatRoom.findOne({ studentId, guideId })
            .populate('studentId', 'name loginId')
            .populate('guideId', 'name loginId department');

        if (!chatRoom) {
            chatRoom = new ChatRoom({ studentId, guideId });
            await chatRoom.save();
            // Re-fetch to populate
            chatRoom = await ChatRoom.findById(chatRoom._id)
                .populate('studentId', 'name loginId')
                .populate('guideId', 'name loginId department');
        }

        res.json(chatRoom);

    } catch (err) {
        console.error('Error fetching chat room:', err);
        res.status(500).json({ message: 'Server error' });
    }
};



exports.getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const messages = await ChatMessage.find({ chatRoomId: roomId }).sort({ createdAt: 1 });

        // Decrypt messages before sending to client
        const decryptedMessages = messages.map(msg => {
            const msgObj = msg.toObject();
            msgObj.message = decrypt(msg.message);
            return msgObj;
        });

        res.json(decryptedMessages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markRead = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;

        // Mark messages as read where sender is NOT the current user
        await ChatMessage.updateMany(
            { chatRoomId: roomId, senderId: { $ne: userId } },
            { isRead: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error marking messages read:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getChatRooms = async (req, res) => {
    try {
        const { role, _id } = req.user;
        let query = {};

        if (role === 'Student') {
            query.studentId = _id;
        } else if (role === 'Faculty') {
            query.guideId = _id;
        } else {
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        const rooms = await ChatRoom.find(query)
            .populate('studentId', 'name loginId')
            .populate('guideId', 'name loginId department')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        // Calculate unread counts and decrypt last message
        const roomsWithDetails = await Promise.all(rooms.map(async (room) => {
            const unreadCount = await ChatMessage.countDocuments({
                chatRoomId: room._id,
                senderId: { $ne: _id },
                isRead: false
            });

            const roomObj = room.toObject();
            if (roomObj.lastMessage && roomObj.lastMessage.message) {
                try {
                    roomObj.lastMessage.message = decrypt(roomObj.lastMessage.message);
                } catch (e) {
                     console.error("Failed to decrypt last message preview");
                }
            }
            return {
                ...roomObj,
                unreadCount
            };
        }));

        res.json(roomsWithDetails);
    } catch (err) {
        console.error('Error fetching chat rooms:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const { role, _id } = req.user;
        let query = {};

        if (role === 'Student') {
            query.studentId = _id;
        } else if (role === 'Faculty') {
            query.guideId = _id;
        } else {
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        const rooms = await ChatRoom.find(query);
        const roomIds = rooms.map(room => room._id);

        const totalUnreadCount = await ChatMessage.countDocuments({
            chatRoomId: { $in: roomIds },
            senderId: { $ne: _id },
            isRead: false
        });

        res.json({ unreadCount: totalUnreadCount });
    } catch (err) {
        console.error('Error fetching unread count:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
