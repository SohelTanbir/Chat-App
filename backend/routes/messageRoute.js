const express = require("express");
const { body } = require("express-validator");
const {
  createMessage,
  getUsersMessages,
  markMessagesSeen,
  deleteMessage,
  uploadMessageFile,
} = require("../controllers/messageController");
const checkLogin = require("../middlewares/checkLogin");
const cloudinaryUpload = require("../middlewares/cloudinaryUpload");
const validate = require("../middlewares/validate");

const router = express.Router();

// message routes
router.post(
  "/message/create",
  checkLogin,
  [
    body("chatId").notEmpty().withMessage("Chat id is required"),
    body("senderId").notEmpty().withMessage("Sender id is required"),
    body("message")
      .if(body("fileUrl").isEmpty())
      .notEmpty().withMessage("Message text is required when no file is attached"),
    body("message")
      .optional()
      .isLength({ max: 2000 }).withMessage("Message cannot exceed 2000 characters"),
  ],
  validate,
  createMessage
);
router.get("/message/find/chat/:chatId", checkLogin, getUsersMessages);
router.put("/message/seen/:chatId", checkLogin, markMessagesSeen);
router.delete("/message/:messageId", checkLogin, deleteMessage);
router.post("/message/upload", checkLogin, cloudinaryUpload.single("file"), uploadMessageFile);

module.exports = router;
