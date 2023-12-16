import { useContext, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { messageContext } from "../../App";

const InputBox = ({ name }) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useContext(messageContext);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // get user input message
  const handleChange = (e) => {
    setNewMessage(e.target.value);
  };

  // get emoji input
  const getEmoji = (emojiObj) => {
    setNewMessage(newMessage + emojiObj.emoji);
  };

  // send message
  const handleSubmit = (e) => {
    e.preventDefault();
    const message = [...messages, newMessage];
    setMessages(message);
    setShowEmojiPicker(false);
    setNewMessage("");
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
        className="flex items-center justify-between relative"
      >
        <input
          type="text"
          onChange={handleChange}
          onFocus={() => setShowEmojiPicker(false)}
          className="w-[95%]   p-2 ps-12  rounded-md focus:outline-none"
          placeholder={`Message to ${name}`}
          value={newMessage}
          spellCheck={false}
        />
        <div
          className="emoji  absolute left-[12px] top-[8px] cursor-pointer "
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <svg
            viewBox="0 0 24 24"
            height="24"
            width="24"
            preserveAspectRatio="xMidYMid meet"
            version="1.1"
            x="0px"
            y="0px"
            enableBackground="new 0 0 24 24"
            xmlSpace="preserve"
          >
            <path
              fill="currentColor"
              d="M9.153,11.603c0.795,0,1.439-0.879,1.439-1.962S9.948,7.679,9.153,7.679 S7.714,8.558,7.714,9.641S8.358,11.603,9.153,11.603z M5.949,12.965c-0.026-0.307-0.131,5.218,6.063,5.551 c6.066-0.25,6.066-5.551,6.066-5.551C12,14.381,5.949,12.965,5.949,12.965z M17.312,14.073c0,0-0.669,1.959-5.051,1.959 c-3.505,0-5.388-1.164-5.607-1.959C6.654,14.073,12.566,15.128,17.312,14.073z M11.804,1.011c-6.195,0-10.826,5.022-10.826,11.217 s4.826,10.761,11.021,10.761S23.02,18.423,23.02,12.228C23.021,6.033,17.999,1.011,11.804,1.011z M12,21.354 c-5.273,0-9.381-3.886-9.381-9.159s3.942-9.548,9.215-9.548s9.548,4.275,9.548,9.548C21.381,17.467,17.273,21.354,12,21.354z  M15.108,11.603c0.795,0,1.439-0.879,1.439-1.962s-0.644-1.962-1.439-1.962s-1.439,0.879-1.439,1.962S14.313,11.603,15.108,11.603z"
            ></path>
          </svg>
        </div>
        <button className="text-2xl text-white ms-5">
          <svg
            width="30px"
            height="30px"
            viewBox="0 0 24 24"
            fill="#F3F3F3"
            enableBackground="blue"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2.996 12.5l-1.157 8.821 20.95-8.821-20.95-8.821zm16.028-.5H3.939l-.882-6.724zM3.939 13h15.085L3.057 19.724z" />
            <path fill="none" d="M0 0h24v24H0z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default InputBox;
