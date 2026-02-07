const express = require("express");
const {
  createChat,
  findChat,
  deleteChat,
  getUserChats,
} = require("../controllers/chatController");
const checkLogin = require("../middlewares/checkLogin");

const router = express.Router();

// chats routes
router.post("/chat/create", checkLogin, createChat);
router.get("/chat/list/:userId", checkLogin, getUserChats);
router.get("/chat/find/:userId/:friendId", checkLogin, findChat);
router.delete("/chat/delete/:chatId", checkLogin, deleteChat);

// expor routes
module.exports = router;
