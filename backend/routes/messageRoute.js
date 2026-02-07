const express = require("express");
const {
  createMessage,
  getUsersMessages,
  markMessagesSeen,
} = require("../controllers/messageController");
const checkLogin = require("../middlewares/checkLogin");

const router = express.Router();

// message routes
router.post("/message/create", checkLogin, createMessage);
router.get("/message/find/chat/:chatId", checkLogin, getUsersMessages);
router.put("/message/seen/:chatId", checkLogin, markMessagesSeen);

module.exports = router;
