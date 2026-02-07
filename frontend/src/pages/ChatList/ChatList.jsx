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
import { useContext, useEffect, useRef, useState } from "react";
import { messageContext, userContext } from "../../App";
import Loader from "../../components/Loader/Loader";
import io from "socket.io-client";
import { convertToBangladeshTime } from "../../../utilities/utilities";
import { useNavigate } from "react-router-dom";
const socket = io(`${import.meta.env.VITE_BASE_URL}`);

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
  const currentUserId = loggedInUser?._id || loggedInUser?.userId;
  const navigate = useNavigate();
  const getChatKey = (id) => (id ? String(id) : "");
  const getInitials = (name) => {
    if (!name) {
      return "?";
    }
    return name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };
  const getAvatarColor = (name) => {
    const colors = [
      "#2563eb",
      "#16a34a",
      "#db2777",
      "#7c3aed",
      "#0f766e",
      "#ea580c",
      "#475569",
      "#dc2626",
    ];
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

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
      });
    }
  }, [messages]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    // identify typing messages
    socket.on("isTyping", ({ user, typing }) => {
      if (!user) return;
      if (typing) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        setIsTyping({ user, typing: true });
        return;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping({ user, typing: false });
      }, 800);
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users || []);
    });

    socket.on("presence-update", ({ onlineUsers: users, lastSeen }) => {
      setOnlineUsers(users || []);
      setLastSeenMap(lastSeen || {});
    });

    socket.on("message", ({ chatId: incomingChatId, message }) => {
      if (!incomingChatId || !message) return;
      const chatKey = getChatKey(incomingChatId);

      setUserChats((prev) => {
        const updated = prev.map((item) =>
          getChatKey(item.chatId) === chatKey
            ? { ...item, lastMessage: message }
            : item,
        );
        const moved = updated.find(
          (item) => getChatKey(item.chatId) === chatKey,
        );
        const rest = updated.filter(
          (item) => getChatKey(item.chatId) !== chatKey,
        );
        return moved ? [moved, ...rest] : updated;
      });

      if (chatKey === getChatKey(chatId)) {
        setMessages((prev) =>
          prev?.some((m) => m._id === message._id) ? prev : [...prev, message],
        );
        if (message.senderId !== currentUserId) {
          markChatSeen(chatKey, true);
        }
        return;
      }

      if (message.senderId !== currentUserId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [chatKey]: (prev[chatKey] || 0) + 1,
        }));
      }
    });

    socket.on("messages-seen", ({ chatId: seenChatId, userId }) => {
      if (!seenChatId || !userId) return;
      if (getChatKey(seenChatId) !== getChatKey(chatId)) return;
      if (userId === currentUserId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === currentUserId ? { ...m, isSeen: true } : m,
        ),
      );
    });

    return () => {
      socket.off("isTyping");
      socket.off("online-users");
      socket.off("presence-update");
      socket.off("message");
      socket.off("messages-seen");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      socket.emit("user-online", currentUserId);
    }
  }, [currentUserId]);

  const getUserChats = async () => {
    var myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      `Bearer ${localStorage.getItem("token")}`,
    );

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/chat/list/${currentUserId}`,
        requestOptions,
      );
      const { chats, success } = await response.json();
      if (!success) {
        setLoading(false);
        return;
      }
      setUserChats(chats || []);
      const unreadMap = (chats || []).reduce((acc, item) => {
        acc[getChatKey(item.chatId)] = item.unreadCount || 0;
        return acc;
      }, {});
      setUnreadCounts(unreadMap);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      getUserChats();
    }
  }, [currentUserId]);

  const markChatSeen = async (targetChatId, emitSocket = false) => {
    const chatKey = getChatKey(targetChatId);
    if (!chatKey) return;
    try {
      await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/message/seen/${chatKey}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (emitSocket) {
        socket.emit("messages-seen", {
          chatId: chatKey,
          userId: currentUserId,
        });
      }
    } catch (err) {
      return;
    }
  };

  const handleSelectChat = (chatItem) => {
    const chatKey = getChatKey(chatItem.chatId);
    setChatId(chatKey);
    setSelectedUser(chatItem.user);
    setUnreadCounts((prev) => ({
      ...prev,
      [chatKey]: 0,
    }));
    markChatSeen(chatKey, true);
  };

  const handleLogout = () => {
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
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/users/photo`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );
      const data = await response.json();
      if (data?.user) {
        setLoggedInUser(data.user);
      }
    } catch (err) {
      return;
    } finally {
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

  // retrieve users messages
  const getUsersMessages = async () => {
    var myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      `Bearer ${localStorage.getItem("token")}`,
    );
    myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    setLoadingMessage(true);
    if (!chatId) {
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/message/find/chat/${chatId}`,
        requestOptions,
      );
      const result = await response.json();
      setMessages(result.messages);
      setLoadingMessage(false);
    } catch (err) {
      setLoadingMessage(false);
    }
  };

  // retrieve users messages
  useEffect(() => {
    getUsersMessages();
  }, [chatId]);

  return (
    <div className="max-w-[1600px] w-full h-[95vh] mx-auto bg-[#ffffff] mt-5 overflow-hidden">
      <div className="flex justify-between h-full">
        <div className="chats-sidebar max-w-[350px] w-full">
          <div className="chats-header bg-[#009432] p-5">
            <div className="user mb-5 flex items-center justify-between">
              <div className="flex items-center  ">
                <div className="relative group w-10 h-10">
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: getAvatarColor(loggedInUser?.name),
                    }}
                  >
                    {loggedInUser?.photo?.url ? (
                      <img
                        className="w-full h-full object-cover rounded-full"
                        style={{ imageRendering: "auto" }}
                        src={loggedInUser.photo.url}
                        alt={loggedInUser.name || "user"}
                      />
                    ) : (
                      <span className="text-sm font-semibold text-[#374151]">
                        {getInitials(loggedInUser?.name)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handlePhotoPicker}
                    className="absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    aria-label="Upload profile photo"
                  >
                    <FaCamera
                      className={
                        photoUploading ? "text-sm animate-pulse" : "text-sm"
                      }
                    />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div className="title ms-3">
                  <h3 className="font-sans font-semibold text-xl text-[#d9dee0] leading-[18px]  uppercase  ">
                    {loggedInUser.name}
                  </h3>
                  <p className="font-sans font-normal text-[12px] text-[#d9dee0]   ">
                    {loggedInUser.email}
                  </p>
                </div>
              </div>
              <div className="user-update relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="text-[#e5e7eb] cursor-pointer hover:text-primary"
                  aria-label="Open menu"
                >
                  <FaEllipsisV />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-100 z-20">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <form className="relative">
              <input
                type="text"
                className="bg-[#fff] w-full py-[4px] ps-10  rounded-md focus:outline-none"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="text-md text-[#c6c6c6] absolute left-[12px] top-[8px]">
                <FaSearch />
              </span>
            </form>
          </div>
          <div className="chat-lists w-full h-[80vh] bg-white overflow-x-auto border-e-[1px]">
            <div className="chat-lists w-full h-[80vh] bg-white overflow-x-auto border-e-[1px]">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <Loader size={40} />
                </div>
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
                <h2 className="text-center text-base py-5 text-gray-600">
                  No chats available
                </h2>
              )}
            </div>
          </div>
        </div>
        {selectedUser ? (
          <div className="chats-body w-full relative flex flex-col h-full min-h-0">
            <div className="w-full  p-5 border-b-[1px]">
              <div className="user flex items-center justify-between">
                <div className="flex items-center  ">
                  <div
                    className=" w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: getAvatarColor(selectedUser?.name),
                    }}
                  >
                    {selectedUser?.photo?.url ? (
                      <img
                        className="w-full h-full object-cover  rounded-full"
                        src={selectedUser.photo.url}
                        alt={selectedUser.name || "user"}
                      />
                    ) : (
                      <span className="text-sm font-semibold text-[#374151]">
                        {getInitials(selectedUser?.name)}
                      </span>
                    )}
                  </div>
                  <div className="title ms-3">
                    <h3 className="font-sans font-semibold text-xl text-black leading-[18px] capitalize">
                      {selectedUser.name}{" "}
                      {currentUserId === selectedUser._id ? "(You)" : ""}
                      {onlineUsers.includes(selectedUser._id) ? (
                        <span className="ml-2 inline-flex items-center">
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                          <span className="ml-2 text-xs text-[#808b9f]">
                            online
                          </span>
                        </span>
                      ) : null}
                    </h3>
                    <div className="h-4">
                      {isTyping?.typing &&
                      isTyping?.user?._id === selectedUser?._id ? (
                        <p className="font-sans font-normal text-xs lowercase text-[#808b9f]">
                          typing...
                        </p>
                      ) : onlineUsers.includes(selectedUser._id) ? null : (
                        <p className="font-sans font-normal text-xs lowercase text-[#808b9f]">
                          {formatLastSeen(lastSeenMap[selectedUser._id])}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="user-update text-[#009432] cursor-pointer  flex items-center text-xl pr-5">
                  <span
                    onClick={() => alert("We are working on it!")}
                    className="ms-8  hover:text-primary"
                  >
                    <FaPhoneAlt />
                  </span>
                  <span
                    onClick={() => alert("We are working on it!")}
                    className="ms-8 hover:text-primary"
                  >
                    <FaVideo />
                  </span>
                </div>
              </div>
            </div>
            {!loadingMessage ? (
              <>
                <div
                  ref={messageContainerRef}
                  className="message-container flex-1 min-h-0 overflow-y-auto px-5 py-4"
                >
                  {messages?.length > 0 ? (
                    messages?.map((message) => (
                      <Message
                        key={message._id}
                        message={message}
                        sender={`${
                          message.senderId == currentUserId ? "me" : "friend"
                        }`}
                      />
                    ))
                  ) : (
                    <p className="w-full h-full flex items-center justify-center text-2xl text-[#ddd]">
                      No Message
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <InputBox
                    name={selectedUser ? selectedUser.name : ""}
                    chatId={chatId}
                  />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader />
              </div>
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
