const express = require("express");
const { body } = require("express-validator");
const {
  createChat,
  findChat,
  deleteChat,
  getUserChats,
} = require("../controllers/chatController");
const checkLogin = require("../middlewares/checkLogin");
const validate = require("../middlewares/validate");

const router = express.Router();

// chats routes
router.post(
  "/chat/create",
  checkLogin,
  [
    body("senderId").notEmpty().withMessage("Sender id is required"),
    body("receiverId").notEmpty().withMessage("Receiver id is required"),
  ],
  validate,
  createChat
);
router.get("/chat/list/:userId", checkLogin, getUserChats);
router.get("/chat/find/:userId/:friendId", checkLogin, findChat);
router.delete("/chat/delete/:chatId", checkLogin, deleteChat);

// export routes
module.exports = router;
