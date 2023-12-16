const MessageModel = require("../models/messageModel");

// add a new message
const createMessage = async (req, res) => {
  const { chatId, senderId, message } = req.body;
  console.log(message)
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
      message: "Message created successfully",
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
  if (!chatId) {
    return res.status(400).json({
      success: false,
      message: "User chat id is required",
    });
  }

  try {
    const messages = await MessageModel.find({ chatId });
    if (!messages) {
      return res.status(404).json({
        success: false,
        message: "There was no message found!",
      });
    }
    res.status(200).json({
      success: true,
      messages,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "There was an server error!",
    });
  }
};

// export controller
module.exports = {
  createMessage,
  getUsersMessages,
};
