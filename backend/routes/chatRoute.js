const express = require('express');
const { createChat, findChat } = require('../controllers/chatController');

const router = express.Router();

// chats routes
// router.post('/chat/create', createChat);
router.get('/chat/find/:userId/:friendId', findChat);









// expor routes
module.exports = router;



