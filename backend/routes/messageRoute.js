const express = require('express');
const { createMessage } = require('../controllers/messageController');

const router =   express.Router();

// message routes
router.post("/message/create", createMessage);


module.exports = router;