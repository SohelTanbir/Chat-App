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
