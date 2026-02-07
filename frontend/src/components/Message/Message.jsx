import { convertToBangladeshTime } from "../../../utilities/utilities";

const Message = ({ message, sender }) => {
  const { time } = convertToBangladeshTime(message?.createdAt);
  return (
    <div
      className={`${
        sender == "me" ? "my-message" : "friend-message"
      } w-max mb-3 py-2 px-4`}
    >
      <p className="m-0 text-white font-normal">{message.message || ""}</p>
      <small className=" text-[#d9dee0] font-normal text-[12px] text-end block">
        {time || ""}
      </small>
      {sender == "me" ? (
        <small className=" text-[#d9dee0] font-normal text-[11px] text-end block">
          {message.isSeen ? "seen" : "sent"}
        </small>
      ) : null}
    </div>
  );
};

export default Message;
