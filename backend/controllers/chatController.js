const ChatModel = require("../models/chatModel");
const User = require("../models/userModel");
const MessageModel = require("../models/messageModel");

// create a new chat
const createChat = async (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) {
    return res.status(400).json({
      success: false,
      message: "Sender and Receiver Id are required",
    });
  }
  // Check already exists chat
  const isChatExists = await ChatModel.findOne({
    users: { $all: [senderId, receiverId] },
  });
  if (isChatExists) {
    return res.status(200).json({
      success: false,
      message: "Chat already exists with this user!",
      userChat: isChatExists,
    });
  }

  const newChat = new ChatModel({ users: [senderId, receiverId] });
  try {
    const result = await newChat.save();
    if (!result) {
      return res.status(500).json({
        success: false,
        message: "There was an server error",
      });
    }
    res.status(201).json({
      success: true,
      message: "Chat created successfully",
    });
  } catch (err) {
    return err;
  }
};

// find specific user chat by user id
const findChat = async (req, res) => {
  const { userId, friendId } = req.params;
  if (!userId || !friendId) {
    return res.status(400).json({
      success: false,
      message: "Sender and Receiver Id are required",
    });
  }
  try {
    // Check chat  exists or not
    const userChat = await ChatModel.findOne({
      users: { $all: [userId, friendId] },
    });
    if (!userChat) {
      return res.status(404).json({
        success: false,
        message: "Chat does not exist",
      });
    }
    res.status(200).json({
      success: true,
      userChat,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// delete a chat
const deleteChat = async (req, res) => {
  const chatId = req.params.chatId;
  try {
    const userChat = await ChatModel.find({ _id: chatId });
    if (!userChat) {
      return res.status(404).json({
        success: false,
        message: "Chat does not exist",
      });
    }
    const result = await ChatModel.findOneAndDelete(chatId);
    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Couldn't delete the chat",
        result,
      });
    }
    return res.status(200).json({
      success: true,
      message: "User chat deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "There was an server error!",
      error: err.message,
    });
  }
};

// export chat controller
module.exports = {
  createChat,
  findChat,
  deleteChat,
  getUserChats,
};

// get user chats list with last message
async function getUserChats(req, res) {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User id is required",
    });
  }

  try {
    const chats = await ChatModel.find({ users: { $in: [userId] } }).sort({ updatedAt: -1 });

    const results = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.users.find((id) => id !== userId);
        const user = otherUserId ? await User.findById(otherUserId).select("-password") : null;
        const chatId = chat._id.toString();
        const lastMessage = await MessageModel.findOne({ chatId }).sort({ createdAt: -1 });
        const unreadCount = await MessageModel.countDocuments({
          chatId,
          senderId: { $ne: userId },
          isSeen: { $ne: true },
        });
        return {
          chatId: chat._id,
          user,
          lastMessage,
          unreadCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      chats: results.filter((item) => item.user),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "There was a server error",
      error: err.message,
    });
  }
}
