const Message = ({ text, sender }) => {
  return (
    <div
      className={`${
        sender == "me" ? "my-message" : "friend-messag"
      } w-max mb-3 py-2 px-4`}
    >
      <p className="m-0 text-white font-normal">{text}</p>
      <small className=" text-[#d9dee0] font-normal text-[12px] text-end block">
        7:55PM
      </small>
    </div>
  );
};

export default Message;
