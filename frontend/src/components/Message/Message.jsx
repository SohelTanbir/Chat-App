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
