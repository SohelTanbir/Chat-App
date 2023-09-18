const express = require('express');
const { createMessage, getUsersMessages } = require('../controllers/messageController');

const router =   express.Router();

// message routes
router.post("/message/create", createMessage);
router.get("/message/find/:chatId", getUsersMessages);


module.exports = router;