const express = require("express");
const {
  createMessage,
  getUsersMessages,
  markMessagesSeen,
  deleteMessage,
  uploadMessageFile,
} = require("../controllers/messageController");
const checkLogin = require("../middlewares/checkLogin");
const cloudinaryUpload = require("../middlewares/cloudinaryUpload");

const router = express.Router();

// message routes
router.post("/message/create", checkLogin, createMessage);
router.get("/message/find/chat/:chatId", checkLogin, getUsersMessages);
router.put("/message/seen/:chatId", checkLogin, markMessagesSeen);
router.delete("/message/:messageId", checkLogin, deleteMessage);
router.post("/message/upload", checkLogin, cloudinaryUpload.single("file"), uploadMessageFile);

module.exports = router;
