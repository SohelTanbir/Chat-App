const express = require('express');
const { createMessage, getUsersMessages } = require('../controllers/messageController');
const checkLogin = require('../middlewares/checkLogin');

const router =   express.Router();

// message routes
router.post("/message/create", checkLogin, createMessage);
router.get("/message/find/:chatId",checkLogin,  getUsersMessages);


module.exports = router