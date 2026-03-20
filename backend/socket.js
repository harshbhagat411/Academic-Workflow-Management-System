const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatMessage = require('./models/ChatMessage');
const ChatRoom = require('./models/ChatRoom');
const { encrypt } = require('./utils/encryption');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "http://localhost:5173", // Allow frontend
            methods: ["GET", "POST"]
        }
    });

    // Middleware for Authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error: No token provided"));

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error("Authentication error: Invalid token"));
            socket.user = decoded; // Attach user to socket
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

        // Join Room
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.user.id} joined room: ${roomId}`);
        });

        // Send Message
        socket.on('send_message', async (data) => {
            try {
                const { roomId, message } = data;

                // Encrypt message for storage
                const encryptedText = encrypt(message);

                // Save to Database
                const newMessage = new ChatMessage({
                    chatRoomId: roomId,
                    senderId: socket.user.id,
                    senderRole: socket.user.role,
                    message: encryptedText,
                    isRead: false,
                    isDelivered: true,
                    isSeen: false
                });
                await newMessage.save();

                // Update ChatRoom lastMessage
                await ChatRoom.findByIdAndUpdate(roomId, {
                    lastMessage: newMessage._id,
                    updatedAt: Date.now()
                });

                // Emit to Room (decrypted/plain for display)
                const messageToEmit = newMessage.toObject();
                messageToEmit.message = message; // Restore plain text for real-time recipients
                io.to(roomId).emit('receive_message', messageToEmit);

            } catch (err) {
                console.error('Error sending message:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Mark Read (Legacy Real-time update)
        socket.on('mark_read', async (roomId) => {
            io.to(roomId).emit('messages_read', { userId: socket.user.id });
        });

        // Mark Seen (New logic)
        socket.on('markAsSeen', async ({ roomId }) => {
            try {
                await ChatMessage.updateMany(
                    { chatRoomId: roomId, senderId: { $ne: socket.user.id }, isSeen: false },
                    { $set: { isSeen: true, isRead: true } }
                );
                
                // Broadcast that messages have been seen by this user
                socket.to(roomId).emit('messagesSeen', { roomId, seenBy: socket.user.id });
            } catch (err) {
                console.error('Error marking seen:', err);
            }
        });

        // Typing Indicator
        socket.on('typing', ({ roomId }) => {
            socket.to(roomId).emit('user_typing', { roomId, userId: socket.user.id });
        });

        socket.on('stopTyping', ({ roomId }) => {
            socket.to(roomId).emit('user_stopped_typing', { roomId, userId: socket.user.id });
        });

        socket.on('disconnect', () => {
            // Optional: Handle disconnect
        });
    });

    return io;
};

module.exports = { initSocket };
