# Chat App — Bug Fixes & Must-Have Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Socket.io privacy bug, add message delete, file/image sharing, input validation, cursor-based pagination, and proper UI error states.

**Architecture:** Backend gets new deps (express-validator, cloudinary, multer-storage-cloudinary), message schema gains 6 new optional fields, socket events scoped to chat rooms. Frontend gets a shared socket singleton eliminating duplicate connections, ErrorBanner component, and updated ChatList/Message/InputBox components.

**Tech Stack:** Node/Express, MongoDB/Mongoose, Socket.io 4.7, React 18, Vite, TailwindCSS, Cloudinary

## Global Constraints

- `req.user` from checkLogin middleware always has shape `{ email, userId }` — never `_id`
- Backend port: `process.env.PORT || 5500`
- All API routes prefixed `/api/v1`
- Frontend env var for backend URL: `import.meta.env.VITE_BASE_URL`
- JWT secret env var: `process.env.JWT_SECREAT` (keep existing typo — changing it breaks deployed tokens)
- Auth token sent as `Authorization: Bearer <token>` header
- Socket instance in frontend is currently duplicated (ChatList.jsx:17 + InputBox.jsx:5) — tasks 7+ fix this with a shared singleton at `frontend/src/socket.js`

---

### Task 1: Install Backend Dependencies + Update Message Schema

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/models/messageModel.js`

**Interfaces:**
- Produces: `MessageModel` with fields `isDeleted`, `deletedAt`, `messageType`, `fileUrl`, `fileName`, `fileSize`; `message` field no longer required

- [ ] **Step 1: Install new backend packages**

```bash
cd backend && npm install express-validator cloudinary multer-storage-cloudinary
```

Expected output: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Update messageModel.js**

Replace `backend/models/messageModel.js` with:

```js
const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    chatId: {
        type: String,
        required: true,
    },
    senderId: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        default: '',
        trim: true,
    },
    isSeen: {
        type: Boolean,
        default: false,
    },
    seenAt: {
        type: Date,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text',
    },
    fileUrl: {
        type: String,
        default: '',
    },
    fileName: {
        type: String,
        default: '',
    },
    fileSize: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    }
});

module.exports = mongoose.model("message", messageSchema);
```

- [ ] **Step 3: Verify server still starts**

```bash
cd backend && node -e "require('./models/messageModel'); console.log('schema ok')"
```

Expected: `schema ok`

- [ ] **Step 4: Commit**

```bash
git add backend/models/messageModel.js backend/package.json backend/package-lock.json
git commit -m "feat: add message schema fields for delete, file sharing, and pagination"
```

---

### Task 2: Fix Socket.io Room Isolation (Backend)

**Files:**
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: nothing new
- Produces: socket events `joinChat(chatId)`, `leaveChat(chatId)` handled; all message/typing/seen events scoped to `io.to(chatId)`; presence events remain global `io.emit()`

- [ ] **Step 1: Replace the socket block in server.js**

Find the block from `io.on("connection", (socket) => {` to its closing `});` (lines 35–81) and replace with:

```js
io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("user-online", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, true);
    socketToUser.set(socket.id, userId);
    lastSeenMap.delete(userId);
    const onlineList = Array.from(onlineUsers.keys());
    const lastSeen = Object.fromEntries(lastSeenMap);
    io.emit("online-users", onlineList);
    io.emit("presence-update", { onlineUsers: onlineList, lastSeen });
  });

  socket.on("joinChat", (chatId) => {
    if (chatId) socket.join(chatId);
  });

  socket.on("leaveChat", (chatId) => {
    if (chatId) socket.leave(chatId);
  });

  socket.on("sendMessage", ({ chatId, message }) => {
    if (!chatId || !message) return;
    io.to(chatId).emit("message", { chatId, message });
  });

  socket.on("messages-seen", ({ chatId, userId }) => {
    if (!chatId || !userId) return;
    io.to(chatId).emit("messages-seen", { chatId, userId });
  });

  socket.on("typing", ({ chatId, user, typing }) => {
    if (!chatId) return;
    io.to(chatId).emit("isTyping", { user, typing });
  });

  socket.on("message-deleted", ({ chatId, messageId }) => {
    if (!chatId || !messageId) return;
    io.to(chatId).emit("message-deleted", { chatId, messageId });
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
```

Note: `typing` event now requires `chatId` — frontend must include it (Task 8 fixes this).

- [ ] **Step 2: Verify server starts**

```bash
cd backend && node server.js &
sleep 2 && kill %1
```

Expected: prints `Server listening on port ...` with no crash.

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "fix: scope socket events to chat rooms, add joinChat/leaveChat handlers"
```

---

### Task 3: Message Pagination (Backend)

**Files:**
- Modify: `backend/controllers/messageController.js`

**Interfaces:**
- Consumes: `GET /api/v1/message/find/chat/:chatId?before=<ISO>&limit=30`
- Produces: `{ success: true, messages: [...], hasMore: boolean }`

- [ ] **Step 1: Update getUsersMessages in messageController.js**

Replace the `getUsersMessages` function (lines 39–66) with:

```js
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
```

- [ ] **Step 2: Test pagination endpoint manually**

Start server, then:
```bash
# first get a chatId from your DB, then:
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5500/api/v1/message/find/chat/<chatId>?limit=5"
```

Expected: `{ success: true, messages: [...up to 5...], hasMore: true/false }`

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/messageController.js
git commit -m "feat: add cursor-based pagination to message fetch endpoint"
```

---

### Task 4: Message Delete (Backend)

**Files:**
- Modify: `backend/controllers/messageController.js`
- Modify: `backend/routes/messageRoute.js`

**Interfaces:**
- Consumes: `DELETE /api/v1/message/:messageId` with `Authorization` header; `req.user.userId` from checkLogin
- Produces: `{ success: true }` + emits `message-deleted` via socket; or error JSON

Note: server.js socket is available globally in the process but not importable. The delete endpoint emits via HTTP response only — the frontend emits the socket event itself after successful delete (see Task 10).

- [ ] **Step 1: Add deleteMessage to messageController.js**

Add this function after `markMessagesSeen` and before `module.exports`:

```js
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
```

- [ ] **Step 2: Export deleteMessage**

Update the `module.exports` at the bottom of `messageController.js`:

```js
module.exports = {
  createMessage,
  getUsersMessages,
  markMessagesSeen,
  deleteMessage,
};
```

- [ ] **Step 3: Add delete route to messageRoute.js**

Add to `backend/routes/messageRoute.js` after the existing routes:

```js
const {
  createMessage,
  getUsersMessages,
  markMessagesSeen,
  deleteMessage,
} = require("../controllers/messageController");

// ...existing routes...
router.delete("/message/:messageId", checkLogin, deleteMessage);
```

The full updated file:

```js
const express = require("express");
const {
  createMessage,
  getUsersMessages,
  markMessagesSeen,
  deleteMessage,
} = require("../controllers/messageController");
const checkLogin = require("../middlewares/checkLogin");

const router = express.Router();

router.post("/message/create", checkLogin, createMessage);
router.get("/message/find/chat/:chatId", checkLogin, getUsersMessages);
router.put("/message/seen/:chatId", checkLogin, markMessagesSeen);
router.delete("/message/:messageId", checkLogin, deleteMessage);

module.exports = router;
```

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/messageController.js backend/routes/messageRoute.js
git commit -m "feat: add delete message endpoint (sender-only, delete for everyone)"
```

---

### Task 5: File/Image Upload (Backend)

**Files:**
- Create: `backend/middlewares/cloudinaryUpload.js`
- Modify: `backend/controllers/messageController.js`
- Modify: `backend/routes/messageRoute.js`
- Modify: `backend/.env` (add Cloudinary vars)

**Interfaces:**
- Consumes: `POST /api/v1/message/upload` multipart/form-data field `file`, max 10MB
- Produces: `{ success: true, fileUrl, fileName, fileSize, messageType }`

- [ ] **Step 1: Add Cloudinary env vars to backend/.env**

Open `backend/.env` and append:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these from https://cloudinary.com (free account → Dashboard).

- [ ] **Step 2: Create cloudinaryUpload.js**

Create `backend/middlewares/cloudinaryUpload.js`:

```js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    return {
      folder: "chat-app/messages",
      resource_type: isImage ? "image" : "raw",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf", "txt", "docx"],
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
```

- [ ] **Step 3: Add uploadMessageFile to messageController.js**

Add this function after `deleteMessage` and before `module.exports`:

```js
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
```

- [ ] **Step 4: Export uploadMessageFile**

Update `module.exports` in `messageController.js`:

```js
module.exports = {
  createMessage,
  getUsersMessages,
  markMessagesSeen,
  deleteMessage,
  uploadMessageFile,
};
```

- [ ] **Step 5: Add upload route to messageRoute.js**

Replace full `backend/routes/messageRoute.js` with:

```js
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

router.post("/message/create", checkLogin, createMessage);
router.get("/message/find/chat/:chatId", checkLogin, getUsersMessages);
router.put("/message/seen/:chatId", checkLogin, markMessagesSeen);
router.delete("/message/:messageId", checkLogin, deleteMessage);
router.post("/message/upload", checkLogin, cloudinaryUpload.single("file"), uploadMessageFile);

module.exports = router;
```

- [ ] **Step 6: Commit**

```bash
git add backend/middlewares/cloudinaryUpload.js backend/controllers/messageController.js backend/routes/messageRoute.js
git commit -m "feat: add Cloudinary file upload endpoint for message attachments"
```

---

### Task 6: Input Validation (Backend)

**Files:**
- Create: `backend/middlewares/validate.js`
- Modify: `backend/routes/userRoutes.js`
- Modify: `backend/routes/messageRoute.js`
- Modify: `backend/routes/chatRoute.js`

**Interfaces:**
- Produces: validation errors returned as `{ success: false, message: "Validation failed", errors: ["..."] }`

- [ ] **Step 1: Create validate.js middleware**

Create `backend/middlewares/validate.js`:

```js
const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => e.msg),
    });
  }
  next();
};

module.exports = validate;
```

- [ ] **Step 2: Add validation to userRoutes.js**

Replace `backend/routes/userRoutes.js` with:

```js
const express = require("express");
const { body } = require("express-validator");
const {
  createUser,
  LoginUser,
  getLoggedInUser,
  getAllUsers,
  forgotPassword,
  resetPassword,
  updateUserPhoto,
} = require("../controllers/userController");
const checkLogin = require("../middlewares/checkLogin");
const upload = require("../middlewares/upload");
const validate = require("../middlewares/validate");
const router = express.Router();

router.post(
  "/users/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  createUser
);

router.post(
  "/users/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  LoginUser
);

router.post("/users/password/forgot", forgotPassword);
router.post("/users/password/reset/:token", resetPassword);
router.get("/password/reset/:token", (req, res) => {
  const frontendBaseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
  return res.redirect(`${frontendBaseUrl}/password/reset/${req.params.token}`);
});
router.get("/users/user", checkLogin, getLoggedInUser);
router.get("/users/all", checkLogin, getAllUsers);
router.put("/users/photo", checkLogin, upload.single("photo"), updateUserPhoto);

module.exports = router;
```

- [ ] **Step 3: Add validation to messageRoute.js**

Replace `backend/routes/messageRoute.js` with:

```js
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
```

- [ ] **Step 4: Add validation to chatRoute.js**

Replace `backend/routes/chatRoute.js` with:

```js
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

module.exports = router;
```

- [ ] **Step 5: Verify server starts cleanly**

```bash
cd backend && node server.js &
sleep 2 && kill %1
```

Expected: starts without error.

- [ ] **Step 6: Commit**

```bash
git add backend/middlewares/validate.js backend/routes/userRoutes.js backend/routes/messageRoute.js backend/routes/chatRoute.js
git commit -m "feat: add express-validator input validation to register, login, message, and chat routes"
```

---

### Task 7: Shared Socket Singleton + ErrorBanner Component (Frontend)

**Files:**
- Create: `frontend/src/socket.js`
- Create: `frontend/src/components/ErrorBanner/ErrorBanner.jsx`

**Interfaces:**
- Produces: `socket` singleton exported from `frontend/src/socket.js` — used by all frontend components
- Produces: `<ErrorBanner message="" onRetry={fn} onDismiss={fn} />` component

- [ ] **Step 1: Create shared socket singleton**

Create `frontend/src/socket.js`:

```js
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BASE_URL, {
  autoConnect: true,
  reconnection: true,
});

export default socket;
```

- [ ] **Step 2: Create ErrorBanner component**

Create `frontend/src/components/ErrorBanner/ErrorBanner.jsx`:

```jsx
const ErrorBanner = ({ message, onRetry, onDismiss, variant = "error" }) => {
  const bg = variant === "warning" ? "bg-yellow-100 border-yellow-400 text-yellow-800" : "bg-red-100 border-red-400 text-red-800";

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-l-4 text-sm ${bg}`}>
      <span>{message}</span>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="underline font-medium hover:no-underline"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="font-bold text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;
```

- [ ] **Step 3: Update InputBox.jsx to use shared socket**

In `frontend/src/components/InputBox/InputBox.jsx`, replace:

```js
import io from "socket.io-client";
const socket = io(`${import.meta.env.VITE_BASE_URL}`);
```

with:

```js
import socket from "../../socket";
```

Also update the `typing` emit to include `chatId` (the server now requires it). Change `handleChange` and `stopTypig` to pass `chatId`:

The full updated `InputBox.jsx`:

```jsx
import { useContext, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { messageContext, userContext } from "../../App";
import socket from "../../socket";

const InputBox = ({ name, chatId }) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useContext(messageContext);
  const [loggedInUser] = useContext(userContext);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const currentUserId = loggedInUser?._id || loggedInUser?.userId;
  const [isSending, setIsSending] = useState(false);
  const textAreaRef = useRef(null);

  const typingTimerRef = useRef(null);
  const typingDelay = 1500;

  const startTyping = () => {
    socket.emit("typing", { chatId, user: loggedInUser, typing: true });
  };
  const stopTyping = () => {
    socket.emit("typing", { chatId, user: loggedInUser, typing: false });
  };

  const handleChange = (e) => {
    setNewMessage(e.target.value);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${Math.min(
        textAreaRef.current.scrollHeight,
        140,
      )}px`;
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    startTyping();
    typingTimerRef.current = setTimeout(stopTyping, typingDelay);
  };

  const getEmoji = (emojiObj) => {
    setNewMessage((prev) => prev + emojiObj.emoji);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;
    if (!chatId || !currentUserId || !newMessage.trim()) return;
    setIsSending(true);

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${localStorage.getItem("token")}`);
    myHeaders.append("Content-Type", "application/json");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/message/create`,
        {
          method: "POST",
          headers: myHeaders,
          body: JSON.stringify({ chatId, senderId: currentUserId, message: newMessage.trim() }),
        }
      );
      const { success, message } = await response.json();
      if (success && message) {
        stopTyping();
        socket.emit("sendMessage", { chatId, message });
        setMessages((prev) =>
          prev?.some((m) => m._id === message._id) ? prev : [...prev, message],
        );
        setShowEmojiPicker(false);
        setNewMessage("");
        if (textAreaRef.current) {
          textAreaRef.current.style.height = "auto";
        }
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="message-input w-full bg-[#009432] py-2 px-5">
      {showEmojiPicker && (
        <div className="absolute bottom-[8%] z-10">
          <EmojiPicker onEmojiClick={getEmoji} />
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-end justify-between relative"
      >
        <textarea
          ref={textAreaRef}
          rows={1}
          onChange={handleChange}
          onFocus={() => setShowEmojiPicker(false)}
          onBlur={stopTyping}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="w-[95%] p-2 ps-12 rounded-md focus:outline-none resize-none overflow-y-auto max-h-[140px]"
          placeholder={`Message to ${name}`}
          value={newMessage}
          spellCheck={false}
        />
        <div
          className="emoji absolute left-[12px] top-[8px] cursor-pointer"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" version="1.1" x="0px" y="0px" enableBackground="new 0 0 24 24" xmlSpace="preserve">
            <path fill="currentColor" d="M9.153,11.603c0.795,0,1.439-0.879,1.439-1.962S9.948,7.679,9.153,7.679 S7.714,8.558,7.714,9.641S8.358,11.603,9.153,11.603z M5.949,12.965c-0.026-0.307-0.131,5.218,6.063,5.551 c6.066-0.25,6.066-5.551,6.066-5.551C12,14.381,5.949,12.965,5.949,12.965z M17.312,14.073c0,0-0.669,1.959-5.051,1.959 c-3.505,0-5.388-1.164-5.607-1.959C6.654,14.073,12.566,15.128,17.312,14.073z M11.804,1.011c-6.195,0-10.826,5.022-10.826,11.217 s4.826,10.761,11.021,10.761S23.02,18.423,23.02,12.228C23.021,6.033,17.999,1.011,11.804,1.011z M12,21.354 c-5.273,0-9.381-3.886-9.381-9.159s3.942-9.548,9.215-9.548s9.548,4.275,9.548,9.548C21.381,17.467,17.273,21.354,12,21.354z M15.108,11.603c0.795,0,1.439-0.879,1.439-1.962s-0.644-1.962-1.439-1.962s-1.439,0.879-1.439,1.962S14.313,11.603,15.108,11.603z"/>
          </svg>
        </div>
        <button className="text-2xl text-white ms-5">
          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="#F3F3F3" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.996 12.5l-1.157 8.821 20.95-8.821-20.95-8.821zm16.028-.5H3.939l-.882-6.724zM3.939 13h15.085L3.057 19.724z"/>
            <path fill="none" d="M0 0h24v24H0z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default InputBox;
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/socket.js frontend/src/components/ErrorBanner/ErrorBanner.jsx frontend/src/components/InputBox/InputBox.jsx
git commit -m "feat: create shared socket singleton, ErrorBanner component; fix duplicate socket connections"
```

---

### Task 8: Socket Rooms + Error States in ChatList (Frontend)

**Files:**
- Modify: `frontend/src/pages/ChatList/ChatList.jsx`

**Interfaces:**
- Consumes: `socket` from `../../socket`, `ErrorBanner` from `../../components/ErrorBanner/ErrorBanner`
- Consumes: pagination API `GET /message/find/chat/:chatId?before=<ISO>&limit=30`

This task rewrites ChatList.jsx to: use shared socket, join/leave chat rooms, add scroll-up pagination, add error states, and listen for `message-deleted`.

- [ ] **Step 1: Replace ChatList.jsx**

Replace the full file `frontend/src/pages/ChatList/ChatList.jsx`:

```jsx
import {
  FaCamera,
  FaEllipsisV,
  FaPhoneAlt,
  FaSearch,
  FaVideo,
} from "react-icons/fa";
import User from "./User";
import Message from "../../components/Message/Message";
import InputBox from "../../components/InputBox/InputBox";
import ErrorBanner from "../../components/ErrorBanner/ErrorBanner";
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { messageContext, userContext } from "../../App";
import Loader from "../../components/Loader/Loader";
import socket from "../../socket";
import { convertToBangladeshTime } from "../../../utilities/utilities";
import { useNavigate } from "react-router-dom";

const ChatList = () => {
  const [messages, setMessages] = useContext(messageContext);
  const [loggedInUser, setLoggedInUser] = useContext(userContext);
  const [userChats, setUserChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [selectedUser, setSelectedUser] = useState(false);
  const [chatId, setChatId] = useState("");
  const [isTyping, setIsTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastSeenMap, setLastSeenMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [msgError, setMsgError] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState(null);

  const currentUserId = loggedInUser?._id || loggedInUser?.userId;
  const navigate = useNavigate();
  const activeChatIdRef = useRef("");

  const getChatKey = (id) => (id ? String(id) : "");

  const getInitials = (name) => {
    if (!name) return "?";
    return name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  };

  const getAvatarColor = (name) => {
    const colors = ["#2563eb", "#16a34a", "#db2777", "#7c3aed", "#0f766e", "#ea580c", "#475569", "#dc2626"];
    if (!name) return colors[0];
    const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "offline";
    const { time } = convertToBangladeshTime(timestamp);
    return `last seen ${time}`;
  };

  const messageContainerRef = useRef(null);
  const menuRef = useRef(null);
  const photoInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    const el = messageContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages]);

  // Outside click closes menu
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Socket events
  useEffect(() => {
    socket.on("isTyping", ({ user, typing }) => {
      if (!user) return;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typing) {
        setIsTyping({ user, typing: true });
      } else {
        typingTimeoutRef.current = setTimeout(() => setIsTyping({ user, typing: false }), 800);
      }
    });

    socket.on("online-users", (users) => setOnlineUsers(users || []));

    socket.on("presence-update", ({ onlineUsers: users, lastSeen }) => {
      setOnlineUsers(users || []);
      setLastSeenMap(lastSeen || {});
    });

    socket.on("message", ({ chatId: incomingChatId, message }) => {
      if (!incomingChatId || !message) return;
      const chatKey = getChatKey(incomingChatId);

      setUserChats((prev) => {
        const updated = prev.map((item) =>
          getChatKey(item.chatId) === chatKey ? { ...item, lastMessage: message } : item,
        );
        const moved = updated.find((item) => getChatKey(item.chatId) === chatKey);
        const rest = updated.filter((item) => getChatKey(item.chatId) !== chatKey);
        return moved ? [moved, ...rest] : updated;
      });

      if (chatKey === getChatKey(activeChatIdRef.current)) {
        setMessages((prev) =>
          prev?.some((m) => m._id === message._id) ? prev : [...prev, message],
        );
        if (message.senderId !== currentUserId) {
          markChatSeen(chatKey, true);
        }
        return;
      }

      if (message.senderId !== currentUserId) {
        setUnreadCounts((prev) => ({ ...prev, [chatKey]: (prev[chatKey] || 0) + 1 }));
      }
    });

    socket.on("messages-seen", ({ chatId: seenChatId, userId }) => {
      if (!seenChatId || !userId) return;
      if (getChatKey(seenChatId) !== getChatKey(activeChatIdRef.current)) return;
      if (userId === currentUserId) return;
      setMessages((prev) =>
        prev.map((m) => m.senderId === currentUserId ? { ...m, isSeen: true } : m),
      );
    });

    socket.on("message-deleted", ({ messageId }) => {
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, message: "", fileUrl: "", fileName: "" } : m,
        ),
      );
    });

    socket.on("disconnect", () => setNetworkError(true));
    socket.on("connect", () => setNetworkError(false));

    return () => {
      socket.off("isTyping");
      socket.off("online-users");
      socket.off("presence-update");
      socket.off("message");
      socket.off("messages-seen");
      socket.off("message-deleted");
      socket.off("disconnect");
      socket.off("connect");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) socket.emit("user-online", currentUserId);
  }, [currentUserId]);

  const getUserChats = async () => {
    setLoading(true);
    setChatError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/chat/list/${currentUserId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
      const { chats, success } = await response.json();
      if (!success) { setLoading(false); return; }
      setUserChats(chats || []);
      const unreadMap = (chats || []).reduce((acc, item) => {
        acc[getChatKey(item.chatId)] = item.unreadCount || 0;
        return acc;
      }, {});
      setUnreadCounts(unreadMap);
    } catch {
      setChatError("Failed to load chats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) getUserChats();
  }, [currentUserId]);

  const markChatSeen = async (targetChatId, emitSocket = false) => {
    const chatKey = getChatKey(targetChatId);
    if (!chatKey) return;
    try {
      await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/message/seen/${chatKey}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (emitSocket) socket.emit("messages-seen", { chatId: chatKey, userId: currentUserId });
    } catch { /* ignore */ }
  };

  const handleSelectChat = (chatItem) => {
    const chatKey = getChatKey(chatItem.chatId);
    // Leave previous room
    if (activeChatIdRef.current) {
      socket.emit("leaveChat", activeChatIdRef.current);
    }
    // Join new room
    socket.emit("joinChat", chatKey);
    activeChatIdRef.current = chatKey;
    setChatId(chatKey);
    setSelectedUser(chatItem.user);
    setUnreadCounts((prev) => ({ ...prev, [chatKey]: 0 }));
    markChatSeen(chatKey, true);
  };

  const handleLogout = () => {
    if (activeChatIdRef.current) socket.emit("leaveChat", activeChatIdRef.current);
    localStorage.removeItem("token");
    setLoggedInUser([]);
    setMessages([]);
    setSelectedUser(false);
    setChatId("");
    setMenuOpen(false);
    navigate("/account/login", { replace: true });
  };

  const handlePhotoPicker = () => {
    if (photoUploading) return;
    photoInputRef.current?.click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("photo", file);
    setPhotoUploading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/users/photo`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      const data = await response.json();
      if (data?.user) setLoggedInUser(data.user);
    } catch { /* ignore */ } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  };

  const filteredChats = userChats.filter((item) => {
    const user = item.user || {};
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.phone?.toLowerCase().includes(term)
    );
  });

  const getUsersMessages = useCallback(async (targetChatId) => {
    if (!targetChatId) return;
    setLoadingMessage(true);
    setMsgError(null);
    setHasMore(false);
    setOldestTimestamp(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/message/find/chat/${targetChatId}?limit=30`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
      const result = await response.json();
      if (result.success) {
        setMessages(result.messages || []);
        setHasMore(result.hasMore || false);
        if (result.messages?.length > 0) {
          setOldestTimestamp(result.messages[0].createdAt);
        }
      }
    } catch {
      setMsgError("Failed to load messages.");
    } finally {
      setLoadingMessage(false);
      // Scroll to bottom after initial load
      setTimeout(() => {
        if (messageContainerRef.current) {
          messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, []);

  useEffect(() => {
    if (chatId) getUsersMessages(chatId);
  }, [chatId]);

  const loadOlderMessages = async () => {
    if (!chatId || !hasMore || loadingOlder || !oldestTimestamp) return;
    setLoadingOlder(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/message/find/chat/${chatId}?before=${encodeURIComponent(oldestTimestamp)}&limit=30`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
      const result = await response.json();
      if (result.success && result.messages?.length > 0) {
        const el = messageContainerRef.current;
        const prevScrollHeight = el ? el.scrollHeight : 0;

        setMessages((prev) => [...result.messages, ...prev]);
        setHasMore(result.hasMore || false);
        setOldestTimestamp(result.messages[0].createdAt);

        // Preserve scroll position
        if (el) {
          requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight - prevScrollHeight;
          });
        }
      } else {
        setHasMore(false);
      }
    } catch { /* ignore */ } finally {
      setLoadingOlder(false);
    }
  };

  const handleScroll = () => {
    const el = messageContainerRef.current;
    if (!el) return;
    if (el.scrollTop < 50 && hasMore && !loadingOlder) {
      loadOlderMessages();
    }
  };

  return (
    <div className="max-w-[1600px] w-full h-[95vh] mx-auto bg-[#ffffff] mt-5 overflow-hidden">
      {networkError && (
        <ErrorBanner
          message="Connection lost. Reconnecting..."
          variant="warning"
          onDismiss={() => setNetworkError(false)}
        />
      )}
      <div className="flex justify-between h-full">
        <div className="chats-sidebar max-w-[350px] w-full">
          <div className="chats-header bg-[#009432] p-5">
            <div className="user mb-5 flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative group w-10 h-10">
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: getAvatarColor(loggedInUser?.name) }}
                  >
                    {loggedInUser?.photo?.url ? (
                      <img className="w-full h-full object-cover rounded-full" src={loggedInUser.photo.url} alt={loggedInUser.name || "user"} />
                    ) : (
                      <span className="text-sm font-semibold text-[#374151]">{getInitials(loggedInUser?.name)}</span>
                    )}
                  </div>
                  <button type="button" onClick={handlePhotoPicker}
                    className="absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    aria-label="Upload profile photo">
                    <FaCamera className={photoUploading ? "text-sm animate-pulse" : "text-sm"} />
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
                <div className="title ms-3">
                  <h3 className="font-sans font-semibold text-xl text-[#d9dee0] leading-[18px] uppercase">{loggedInUser.name}</h3>
                  <p className="font-sans font-normal text-[12px] text-[#d9dee0]">{loggedInUser.email}</p>
                </div>
              </div>
              <div className="user-update relative" ref={menuRef}>
                <button type="button" onClick={() => setMenuOpen((prev) => !prev)}
                  className="text-[#e5e7eb] cursor-pointer hover:text-primary" aria-label="Open menu">
                  <FaEllipsisV />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-100 z-20">
                    <button type="button" onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
            <form className="relative">
              <input type="text" className="bg-[#fff] w-full py-[4px] ps-10 rounded-md focus:outline-none"
                placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <span className="text-md text-[#c6c6c6] absolute left-[12px] top-[8px]"><FaSearch /></span>
            </form>
          </div>
          <div className="chat-lists w-full h-[80vh] bg-white overflow-x-auto border-e-[1px]">
            {chatError && (
              <ErrorBanner message={chatError} onRetry={getUserChats} onDismiss={() => setChatError(null)} />
            )}
            {loading ? (
              <div className="w-full h-full flex items-center justify-center overflow-hidden"><Loader size={40} /></div>
            ) : filteredChats.length ? (
              filteredChats.map((item) => (
                <User
                  key={item.chatId}
                  user={item.user}
                  lastMessage={item.lastMessage}
                  selectedUser={selectedUser}
                  handleStartConversation={() => handleSelectChat(item)}
                  onlineUsers={onlineUsers}
                  lastSeenAt={lastSeenMap[item.user?._id]}
                  unreadCount={unreadCounts[getChatKey(item.chatId)] || 0}
                />
              ))
            ) : (
              <p className="text-center text-sm py-8 text-gray-400 px-4">
                No conversations yet. Search for a user to start chatting.
              </p>
            )}
          </div>
        </div>

        {selectedUser ? (
          <div className="chats-body w-full relative flex flex-col h-full min-h-0">
            <div className="w-full p-5 border-b-[1px]">
              <div className="user flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: getAvatarColor(selectedUser?.name) }}>
                    {selectedUser?.photo?.url ? (
                      <img className="w-full h-full object-cover rounded-full" src={selectedUser.photo.url} alt={selectedUser.name || "user"} />
                    ) : (
                      <span className="text-sm font-semibold text-[#374151]">{getInitials(selectedUser?.name)}</span>
                    )}
                  </div>
                  <div className="title ms-3">
                    <h3 className="font-sans font-semibold text-xl text-black leading-[18px] capitalize">
                      {selectedUser.name} {currentUserId === selectedUser._id ? "(You)" : ""}
                      {onlineUsers.includes(selectedUser._id) && (
                        <span className="ml-2 inline-flex items-center">
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                          <span className="ml-2 text-xs text-[#808b9f]">online</span>
                        </span>
                      )}
                    </h3>
                    <div className="h-4">
                      {isTyping?.typing && isTyping?.user?._id === selectedUser?._id ? (
                        <p className="font-sans font-normal text-xs lowercase text-[#808b9f]">typing...</p>
                      ) : onlineUsers.includes(selectedUser._id) ? null : (
                        <p className="font-sans font-normal text-xs lowercase text-[#808b9f]">{formatLastSeen(lastSeenMap[selectedUser._id])}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="user-update text-[#009432] cursor-pointer flex items-center text-xl pr-5">
                  <span onClick={() => alert("We are working on it!")} className="ms-8 hover:text-primary"><FaPhoneAlt /></span>
                  <span onClick={() => alert("We are working on it!")} className="ms-8 hover:text-primary"><FaVideo /></span>
                </div>
              </div>
            </div>

            {!loadingMessage ? (
              <>
                <div
                  ref={messageContainerRef}
                  onScroll={handleScroll}
                  className="message-container flex-1 min-h-0 overflow-y-auto px-5 py-4"
                >
                  {loadingOlder && (
                    <div className="flex justify-center py-2"><Loader size={20} /></div>
                  )}
                  {msgError && (
                    <ErrorBanner message={msgError} onRetry={() => getUsersMessages(chatId)} onDismiss={() => setMsgError(null)} />
                  )}
                  {messages?.length > 0 ? (
                    messages.map((message) => (
                      <Message
                        key={message._id}
                        message={message}
                        sender={message.senderId === currentUserId ? "me" : "friend"}
                        chatId={chatId}
                        onDeleted={(messageId) => {
                          setMessages((prev) =>
                            prev.map((m) =>
                              m._id === messageId ? { ...m, isDeleted: true, message: "", fileUrl: "", fileName: "" } : m,
                            ),
                          );
                        }}
                      />
                    ))
                  ) : (
                    <p className="w-full h-full flex items-center justify-center text-lg text-[#ddd]">
                      No messages yet. Say hello!
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <InputBox name={selectedUser ? selectedUser.name : ""} chatId={chatId} />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Loader /></div>
            )}
          </div>
        ) : (
          <p className="w-full h-screen flex items-center justify-center text-2xl text-[#ddd]">
            Tap to start Conversation
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatList;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/ChatList/ChatList.jsx
git commit -m "feat: add socket room join/leave, scroll pagination, error states, and message-deleted listener to ChatList"
```

---

### Task 9: Message Delete + File/Image Rendering (Frontend)

**Files:**
- Modify: `frontend/src/components/Message/Message.jsx`

**Interfaces:**
- Consumes: `message` prop with fields: `_id`, `message`, `senderId`, `createdAt`, `isSeen`, `isDeleted`, `messageType`, `fileUrl`, `fileName`, `fileSize`
- Consumes: `sender` prop: `"me"` | `"friend"`
- Consumes: `chatId` prop: string
- Consumes: `onDeleted(messageId)` callback prop

- [ ] **Step 1: Replace Message.jsx**

Replace the full file `frontend/src/components/Message/Message.jsx`:

```jsx
import { useState, useRef, useEffect } from "react";
import { convertToBangladeshTime } from "../../../utilities/utilities";
import socket from "../../socket";

const Message = ({ message, sender, chatId, onDeleted }) => {
  const { time } = convertToBangladeshTime(message?.createdAt);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (!menuRef.current?.contains(e.target)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showMenu]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this message for everyone?")) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/message/${message._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        socket.emit("message-deleted", { chatId, messageId: message._id });
        onDeleted?.(message._id);
      }
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isMe = sender === "me";

  const renderContent = () => {
    if (message.isDeleted) {
      return (
        <p className="text-[#d9dee0] italic text-sm">This message was deleted</p>
      );
    }

    if (message.messageType === "image" && message.fileUrl) {
      return (
        <div>
          <img
            src={message.fileUrl}
            alt="shared"
            className="max-w-[220px] rounded-md cursor-pointer"
            onClick={() => setLightbox(true)}
          />
          {message.message && (
            <p className="mt-1 text-white font-normal break-words whitespace-pre-wrap">{message.message}</p>
          )}
        </div>
      );
    }

    if (message.messageType === "file" && message.fileUrl) {
      return (
        <a
          href={message.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white underline"
        >
          <span>📎</span>
          <span className="break-all">{message.fileName || "File"}</span>
          {message.fileSize > 0 && (
            <span className="text-xs text-[#d9dee0] shrink-0">({formatFileSize(message.fileSize)})</span>
          )}
        </a>
      );
    }

    return (
      <p className="m-0 text-white font-normal break-words whitespace-pre-wrap">
        {message.message || ""}
      </p>
    );
  };

  return (
    <>
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setLightbox(false)}
        >
          <img src={message.fileUrl} alt="full size" className="max-w-[90vw] max-h-[90vh] rounded-md" />
        </div>
      )}

      <div
        className={`${isMe ? "my-message" : "friend-message"} w-fit max-w-[70%] mb-3 py-2 px-4 break-words whitespace-pre-wrap relative group`}
        onContextMenu={(e) => {
          if (isMe && !message.isDeleted) {
            e.preventDefault();
            setShowMenu(true);
          }
        }}
      >
        {renderContent()}

        <small className="text-[#d9dee0] font-normal text-[12px] text-end block">{time || ""}</small>
        {isMe && !message.isDeleted && (
          <small className="text-[#d9dee0] font-normal text-[11px] text-end block">
            {message.isSeen ? "seen" : "sent"}
          </small>
        )}

        {isMe && !message.isDeleted && showMenu && (
          <div
            ref={menuRef}
            className="absolute bottom-full right-0 mb-1 bg-white rounded shadow-lg border border-gray-100 z-10 min-w-[100px]"
          >
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Message;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Message/Message.jsx
git commit -m "feat: add message delete (right-click menu), image lightbox, and file download rendering"
```

---

### Task 10: File/Image Sending in InputBox (Frontend)

**Files:**
- Modify: `frontend/src/components/InputBox/InputBox.jsx`

**Interfaces:**
- Consumes: `POST /api/v1/message/upload` with multipart form-data field `file`
- Consumes: `POST /api/v1/message/create` with `{ chatId, senderId, message, fileUrl, fileName, fileSize, messageType }`

- [ ] **Step 1: Replace InputBox.jsx with file upload support**

Replace the full file `frontend/src/components/InputBox/InputBox.jsx`:

```jsx
import { useContext, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { messageContext, userContext } from "../../App";
import socket from "../../socket";

const InputBox = ({ name, chatId }) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useContext(messageContext);
  const [loggedInUser] = useContext(userContext);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const currentUserId = loggedInUser?._id || loggedInUser?.userId;
  const [isSending, setIsSending] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingDelay = 1500;

  const startTyping = () => socket.emit("typing", { chatId, user: loggedInUser, typing: true });
  const stopTyping = () => socket.emit("typing", { chatId, user: loggedInUser, typing: false });

  const handleChange = (e) => {
    setNewMessage(e.target.value);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 140)}px`;
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    startTyping();
    typingTimerRef.current = setTimeout(stopTyping, typingDelay);
  };

  const getEmoji = (emojiObj) => setNewMessage((prev) => prev + emojiObj.emoji);

  const sendMessage = async ({ message = "", fileUrl = "", fileName = "", fileSize = 0, messageType = "text" }) => {
    if (!chatId || !currentUserId) return;
    if (!message.trim() && !fileUrl) return;

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${localStorage.getItem("token")}`);
    myHeaders.append("Content-Type", "application/json");

    const response = await fetch(
      `${import.meta.env.VITE_BASE_URL}/api/v1/message/create`,
      {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify({ chatId, senderId: currentUserId, message: message.trim(), fileUrl, fileName, fileSize, messageType }),
      }
    );
    const { success, message: savedMsg } = await response.json();
    if (success && savedMsg) {
      stopTyping();
      socket.emit("sendMessage", { chatId, message: savedMsg });
      setMessages((prev) =>
        prev?.some((m) => m._id === savedMsg._id) ? prev : [...prev, savedMsg],
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending || !newMessage.trim()) return;
    setIsSending(true);
    try {
      await sendMessage({ message: newMessage.trim() });
      setShowEmojiPicker(false);
      setNewMessage("");
      if (textAreaRef.current) textAreaRef.current.style.height = "auto";
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/message/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        }
      );
      const data = await response.json();
      if (data.success) {
        await sendMessage({
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          messageType: data.messageType,
        });
      } else {
        setUploadError(data.message || "Upload failed");
      }
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="message-input w-full bg-[#009432] py-2 px-5">
      {uploadError && (
        <p className="text-red-200 text-xs mb-1">{uploadError}</p>
      )}
      {showEmojiPicker && (
        <div className="absolute bottom-[8%] z-10">
          <EmojiPicker onEmojiClick={getEmoji} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end justify-between relative">
        <textarea
          ref={textAreaRef}
          rows={1}
          onChange={handleChange}
          onFocus={() => setShowEmojiPicker(false)}
          onBlur={stopTyping}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="w-[95%] p-2 ps-20 rounded-md focus:outline-none resize-none overflow-y-auto max-h-[140px]"
          placeholder={`Message to ${name}`}
          value={newMessage}
          spellCheck={false}
        />

        {/* Emoji button */}
        <div
          className="emoji absolute left-[12px] top-[8px] cursor-pointer"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" version="1.1" enableBackground="new 0 0 24 24" xmlSpace="preserve">
            <path fill="currentColor" d="M9.153,11.603c0.795,0,1.439-0.879,1.439-1.962S9.948,7.679,9.153,7.679 S7.714,8.558,7.714,9.641S8.358,11.603,9.153,11.603z M5.949,12.965c-0.026-0.307-0.131,5.218,6.063,5.551 c6.066-0.25,6.066-5.551,6.066-5.551C12,14.381,5.949,12.965,5.949,12.965z M17.312,14.073c0,0-0.669,1.959-5.051,1.959 c-3.505,0-5.388-1.164-5.607-1.959C6.654,14.073,12.566,15.128,17.312,14.073z M11.804,1.011c-6.195,0-10.826,5.022-10.826,11.217 s4.826,10.761,11.021,10.761S23.02,18.423,23.02,12.228C23.021,6.033,17.999,1.011,11.804,1.011z M12,21.354 c-5.273,0-9.381-3.886-9.381-9.159s3.942-9.548,9.215-9.548s9.548,4.275,9.548,9.548C21.381,17.467,17.273,21.354,12,21.354z M15.108,11.603c0.795,0,1.439-0.879,1.439-1.962s-0.644-1.962-1.439-1.962s-1.439,0.879-1.439,1.962S14.313,11.603,15.108,11.603z"/>
          </svg>
        </div>

        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute left-[42px] top-[8px] cursor-pointer text-gray-600 hover:text-gray-800 disabled:opacity-50"
          aria-label="Attach file"
        >
          {uploading ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="animate-spin">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" opacity=".3"/>
              <path d="M12 2v4a8 8 0 0 1 0 16v4a12 12 0 0 0 0-24z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
            </svg>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
        />

        <button className="text-2xl text-white ms-5" disabled={isSending}>
          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="#F3F3F3" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.996 12.5l-1.157 8.821 20.95-8.821-20.95-8.821zm16.028-.5H3.939l-.882-6.724zM3.939 13h15.085L3.057 19.724z"/>
            <path fill="none" d="M0 0h24v24H0z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default InputBox;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/InputBox/InputBox.jsx
git commit -m "feat: add file/image attachment support to InputBox with upload progress and error state"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Socket.io room isolation — Tasks 2 + 8 (joinChat/leaveChat on both sides)
- ✅ Message schema additions — Task 1
- ✅ Message delete — Tasks 4 + 9
- ✅ File/image sharing via Cloudinary — Tasks 5 + 10
- ✅ Input validation — Task 6
- ✅ Cursor-based pagination — Tasks 3 + 8
- ✅ Error states in UI — Tasks 7 + 8 (ErrorBanner, empty states, network disconnect)

**Type consistency check:**
- `req.user.userId` used consistently (Tasks 4, 5) — matches checkLogin output
- `socket` singleton imported from `../../socket` in InputBox (Task 7) and Message (Task 9)
- `onDeleted(messageId)` callback: defined in ChatList.jsx (Task 8), consumed in Message.jsx (Task 9)
- `message-deleted` event: server emits in Task 2, frontend listens in Task 8, frontend emits in Task 9

**No placeholders:** All steps have complete code.
