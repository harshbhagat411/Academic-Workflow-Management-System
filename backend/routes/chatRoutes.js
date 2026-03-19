const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/room', protect, chatController.getChatRoom);
router.get('/messages/:roomId', protect, chatController.getMessages);
router.post('/mark-read', protect, chatController.markRead);
router.get('/rooms', protect, chatController.getChatRooms);
router.get('/unread-count', protect, chatController.getUnreadCount);

module.exports = router;
