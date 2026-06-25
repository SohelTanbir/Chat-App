const MessageModel = require("../models/messageModel");

// add a new message
const createMessage = async (req, res) => {
  const { chatId, senderId, message } = req.body;
  if (!chatId || !senderId || !message) {
    return res.status(201).json({
      success: false,
      message: "Sender, Receiver and Chat id are required",
    });
  }
  const newMessage = await MessageModel({
    chatId,
    senderId,
    message,
  });
  try {
    const result = await newMessage.save();
    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Message saved Failed!",
      });
    }
    res.status(201).json({
      success: true,
      message: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "There was an server error!",
      error: err.message,
    });
  }
};

// get users messages
const getUsersMessages = async (req, res) => {
  const { chatId } = req.params;
  const { before, limit = 30 } = req.query;

  if (!chatId) {
    return res.status(400).json({
      success: false,
      message: "Chat id is required",
    });
  }

  try {
    const query = { chatId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const pageSize = Math.min(parseInt(limit, 10) || 30, 100);

    const messages = await MessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize + 1)
      .lean();

    const hasMore = messages.length > pageSize;
    const result = messages.slice(0, pageSize).reverse();

    res.status(200).json({
      success: true,
      messages: result,
      hasMore,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "There was a server error!",
    });
  }
};

// mark messages seen in a chat
const markMessagesSeen = async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.user || {};
  if (!chatId || !userId) {
    return res.status(400).json({
      success: false,
      message: "Chat id and user id are required",
    });
  }

  try {
    const result = await MessageModel.updateMany(
      { chatId, senderId: { $ne: userId }, isSeen: { $ne: true } },
      { $set: { isSeen: true, seenAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      updated: result.modifiedCount || 0,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "There was an server error!",
      error: err.message,
    });
  }
};

// delete message (soft delete)
const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.user;

  if (!messageId) {
    return res.status(400).json({
      success: false,
      message: "Message id is required",
    });
  }

  try {
    const msg = await MessageModel.findById(messageId);
    if (!msg) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (msg.senderId !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    if (msg.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Message already deleted",
      });
    }

    await MessageModel.findByIdAndUpdate(messageId, {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        message: '',
        fileUrl: '',
        fileName: '',
      },
    });

    return res.status(200).json({
      success: true,
      chatId: msg.chatId,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "There was a server error!",
      error: err.message,
    });
  }
};

// upload message file via Cloudinary
const uploadMessageFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "File is required",
    });
  }

  try {
    const isImage = req.file.mimetype.startsWith("image/");
    const fileUrl = req.file.path;
    const fileName = req.file.originalname || req.file.filename || "file";
    const fileSize = req.file.size || 0;
    const messageType = isImage ? "image" : "file";

    return res.status(200).json({
      success: true,
      fileUrl,
      fileName,
      fileSize,
      messageType,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "File upload failed",
      error: err.message,
    });
  }
};

// export controller
module.exports = {
  createMessage,
  getUsersMessages,
  markMessagesSeen,
  deleteMessage,
  uploadMessageFile,
};
