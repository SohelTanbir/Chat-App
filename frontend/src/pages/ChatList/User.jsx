import { convertToBangladeshTime } from "../../../utilities/utilities";

const User = ({
  user,
  handleStartConversation,
  selectedUser,
  onlineUsers,
  lastMessage,
  lastSeenAt,
  unreadCount,
}) => {
  const isOnline = onlineUsers?.includes(user._id);
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
  const lastMessageTime = lastMessage?.createdAt
    ? convertToBangladeshTime(lastMessage.createdAt).time
    : "";
  const lastSeenTime = lastSeenAt
    ? `last seen ${convertToBangladeshTime(lastSeenAt).time}`
    : "offline";
  const lastMessageText = lastMessage?.message || "No messages yet";

  console.log("unreadCount", unreadCount);

  return (
    <div
      onClick={() => handleStartConversation()}
      className={`${
        selectedUser?._id == user._id ? "selecatedUser hover:!bg-[#d4cdcd]" : ""
      } user flex items-center justify-between cursor-pointer   hover:bg-[#f6f3f3] py-4 px-5 rounded-sm border-b-[1px] border-[#F6F5F7] select-none`}
    >
      <div className="flex items-center  ">
        <div
          className=" w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: getAvatarColor(user?.name) }}
        >
          {user?.photo?.url ? (
            <img
              className="w-full h-full object-cover  rounded-full"
              src={user.photo.url}
              alt={user.name}
            />
          ) : (
            <span className="text-xs font-semibold text-white">
              {getInitials(user?.name)}
            </span>
          )}
        </div>
        <div className="title ms-3">
          <h3 className="font-sans font-semibold text-lg text-[#6d6d6d] leading-[18px]   ">
            {user.name ? user.name : "User"}
          </h3>
          <p className="font-sans font-normal text-[14px] text-[#989898]   ">
            {lastMessageText}
          </p>
        </div>
      </div>
      <div className="text-[#989898] text-sm text-right flex flex-col items-end gap-1">
        <span>{lastMessageTime || ""}</span>
        {unreadCount > 0 ? (
          <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-green-500 text-white text-[11px] px-1 font-semibold">
            {unreadCount}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default User;
