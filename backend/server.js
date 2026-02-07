const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const connectDatabase = require("./Database/databaseConnection");

// use dotenv configuration
dotenv.config();

// database connection
connectDatabase();

// socket connection start
const onlineUsers = new Map();
const socketToUser = new Map();
const lastSeenMap = new Map();

io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("user-online", (userId) => {
    if (!userId) {
      return;
    }
    onlineUsers.set(userId, true);
    socketToUser.set(socket.id, userId);
    lastSeenMap.delete(userId);
    const onlineList = Array.from(onlineUsers.keys());
    const lastSeen = Object.fromEntries(lastSeenMap);
    io.emit("online-users", onlineList);
    io.emit("presence-update", { onlineUsers: onlineList, lastSeen });
  });

  // receive message from client
  socket.on("sendMessage", ({ chatId, message }) => {
    // send message to all clients
    io.emit("message", { chatId, message });
  });

  socket.on("messages-seen", ({ chatId, userId }) => {
    if (!chatId || !userId) return;
    io.emit("messages-seen", { chatId, userId });
  });

  // detect someone is typing
  socket.on("typing", ({ user, typing }) => {
    // send message to all clients
    io.emit("isTyping", { user, typing });
  });

  socket.on("disconnect", () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      onlineUsers.delete(userId);
      socketToUser.delete(socket.id);
      lastSeenMap.set(userId, Date.now());
      const onlineList = Array.from(onlineUsers.keys());
      const lastSeen = Object.fromEntries(lastSeenMap);
      io.emit("online-users", onlineList);
      io.emit("presence-update", { onlineUsers: onlineList, lastSeen });
    }
    console.log("User disconnected");
  });
});

// socket connection end

// import all routes
const userRoutes = require("./routes/userRoutes");
const chatRoute = require("./routes/chatRoute");
const messageRoute = require("./routes/messageRoute");

// user routes
app.use("/api/v1", userRoutes);

// chat routes
app.use("/api/v1", chatRoute);

// message routes
app.use("/api/v1", messageRoute);

// default Error Handler
const errorHandler = (err, req, res, next) => {
  if (req.headersSent) {
    return next(err.message);
  }
  res.status(500).json({
    success: false,
    message: err,
  });
};

app.use(errorHandler);

// listen server  on port
httpServer.listen(process.env.PORT || 5500, () => {
  console.log(`Server listening on port ${process.env.PORT || 5500}`);
});
