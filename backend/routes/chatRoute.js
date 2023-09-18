const express = require('express');
const { createChat } = require('../controllers/chatController');

const router = express.Router();

// chats routes
router.post('/chat/create', createChat);









// expor routes
module.exports = router;



