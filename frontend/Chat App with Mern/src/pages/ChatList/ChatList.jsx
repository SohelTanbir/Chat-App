import { FaPen, FaPhoneAlt, FaSearch, FaVideo } from "react-icons/fa";
import User from "./User";
import Message from "../../components/Message/Message";
import InputBox from "../../components/InputBox/InputBox";
import { useContext, useEffect, useRef, useState } from "react";
import { messageContext, userContext } from "../../App";
import Loader from "../../components/Loader/Loader";

const ChatList = () => {
  const [messages, setMessages] = useContext(messageContext);
  const [loggedInUser] = useContext(userContext);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [selectedUser, setSelectedUser] = useState(false);
  const [chatId, setChatId] = useState("");

  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
      });
    }
  }, [messages]);

  // handle select user and create new chat
  const handleStartConversation = async (user) => {
    var myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      `Bearer ${localStorage.getItem("token")}`
    );
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      senderId: loggedInUser._id,
      receiverId: user._id,
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(
      "http://localhost:5000/api/v1/chat/create",
      requestOptions
    );
    const { userChat } = await response.json();
    if (userChat._id) {
      setChatId(userChat._id);
      setMessages(user);
      setSelectedUser(user);
    }
  };

  const getAllUsers = async () => {
    var myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      `Bearer ${localStorage.getItem("token")}`
    );

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/users/all",
        requestOptions
      );
      const { allUsers, success } = await response.json();
      if (!success) {
        setLoading(false);
        return;
      }
      setAllUsers(allUsers);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  // retrive users messages
  const getUsersMessages = async () => {
    var myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      `Bearer ${localStorage.getItem("token")}`
    );
    myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    setLoadingMessage(true);
    if (!chatId.length > 0) {
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/message/find/chat/${chatId}`,
        requestOptions
      );
      const result = await response.json();
      setMessages(result.messages);
      setLoadingMessage(false);
    } catch (err) {
      setLoadingMessage(false);
    }
  };

  // retrive users messages
  useEffect(() => {
    getUsersMessages();
  }, [chatId.length]);

  return (
    <div className="max-w-[1600px] w-full h-[95vh] mx-auto bg-[#ffffff] mt-5 overflow-hidden">
      <div className="flex justify-between">
        <div className="chats-sidebar max-w-[350px] w-full">
          <div className="chats-header bg-[#009432] p-5">
            <div className="user mb-5 flex items-center justify-between">
              <div className="flex items-center  ">
                <div className=" w-10 h-10">
                  <img
                    className="w-full h-full object-cover  rounded-full"
                    src="/images/sohelrana.jpg"
                    alt="user"
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
              <div className="user-update text-[#e5e7eb] cursor-pointer hover:text-primary">
                <FaPen />
              </div>
            </div>
            <form className="relative">
              <input
                type="text"
                className="bg-[#fff] w-full py-[4px] ps-10  rounded-md focus:outline-none"
                placeholder="Search"
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
              ) : allUsers ? (
                allUsers.map((user) => (
                  <User
                    user={user}
                    key={user._id}
                    selectedUser={selectedUser}
                    handleStartConversation={handleStartConversation}
                  />
                ))
              ) : (
                <h2 className="text-center text-base py-5 text-gray-600">
                  No users available
                </h2>
              )}
            </div>
          </div>
        </div>
        {selectedUser ? (
          <div className="chats-body  w-full  relative">
            <div className="w-full  p-5 border-b-[1px]">
              <div className="user flex items-center justify-between">
                <div className="flex items-center  ">
                  <div className=" w-10 h-10">
                    <img
                      className="w-full h-full object-cover  rounded-full"
                      src={`${
                        selectedUser.photo?.url
                          ? selectedUser.photo.url
                          : "/images/user-default.png"
                      }`}
                      alt="user"
                    />
                  </div>
                  <div className="title ms-3">
                    <h3 className="font-sans font-semibold text-xl text-black leading-[18px] capitalize  ">
                      {selectedUser.name}{" "}
                      {loggedInUser._id === selectedUser._id ? "(You)" : ""}
                    </h3>
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
                  className="message-container h-[80vh] overflow-y-auto  px-5 py-4"
                >
                  {messages?.length > 0 ? (
                    messages?.map((message) => (
                      <Message
                        key={message._id}
                        text={message.message}
                        sender={`${
                          message.senderId == loggedInUser._id ? "me" : "friend"
                        }`}
                      />
                    ))
                  ) : (
                    <p className="w-full h-full flex items-center justify-center text-2xl text-[#ddd]">
                      No Message
                    </p>
                  )}
                </div>

                <InputBox
                  name={selectedUser ? selectedUser.name : ""}
                  chatId={chatId}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader />
              </div>
            )}
          </div>
        ) : (
          <p className="w-full h-screen flex items-center justify-center text-2xl text-[#ddd]">
            Tap to start Conversasion
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatList;
