const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

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
const connectDatabase = require("./Database/databaseConnection");

// use dotenv configuration
dotenv.config();

// database connection
connectDatabase();

// socket connection start
io.on("connection", (socket) => {
  console.log("New user connected");

  // receive message from client
  socket.on("sendMessage", ({ user, message }) => {
    // send message to all clients
    io.emit("message", message);
  });

  // detect someone is typing
  socket.on("typing", ({ user, typing }) => {
    // send message to all clients
    io.emit("isTyping", { user, typing });
  });

  socket.on("disconnect", () => {
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
