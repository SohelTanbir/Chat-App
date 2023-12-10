import { FaPen, FaPhoneAlt, FaSearch, FaVideo } from "react-icons/fa";
import User from "./User";
import Message from "../../components/Message/Message";
import InputBox from "../../components/InputBox/InputBox";
import { useContext, useEffect, useState } from "react";
import { messageContext, userContext } from "../../App";

const ChatList = () => {
  const [messages] = useContext(messageContext);
  const [loggedInUser] = useContext(userContext);
  const [allUsers, setAllUsers] = useState([]);

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

    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/users/all",
        requestOptions
      );
      const { allUsers } = await response.json();
      setAllUsers(allUsers);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  return (
    <div className="max-w-[1600px] w-full mx-auto bg-[#ffffff] mt-5">
      <div className="flex justify-between">
        <div className="chats-sidebar max-w-[400px] w-full">
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
            {allUsers ? (
              allUsers.map((user) => (
                <User
                  avatar="/images/user-2.png"
                  name={user.name}
                  message={`${user.name} Hi, how are you?`}
                  time="10:10PM"
                />
              ))
            ) : (
              <h2 className="text-center text-base py-5 text-gray-600">
                No users available
              </h2>
            )}
            {/* 
            <User
              avatar="/images/user-3.png"
              name="Jessica"
              message="Hello Jessica"
              time="12:10AM"
            />

            <User
              avatar="/images/user-4.png"
              name="Michael"
              message="Hey, your name please?"
              time="09:10PM"
            />

            <User
              avatar="/images/user-5.png"
              name="David"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-6.png"
              name="Joseph"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-7.png"
              name="Benjamin"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-8.png"
              name="Olivia"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-9.png"
              name="Thomas"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-10.png"
              name="Sophia"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-11.png"
              name="Sohel Tanvir"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-12.png"
              name="Hussain   Ahmed"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-13.png"
              name="Shahid"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-14.png"
              name="Kamal"
              message="Hi, how are you?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-15.png"
              name="Zoe"
              message="What's up? How's your day been so far?"
              time="11:30PM"
            />

            <User
              avatar="/images/user-16.png"
              name="Samuel"
              message="Tomar basa kothai?"
              time="11:30PM"
            /> */}
          </div>
        </div>
        <div className="chats-body  w-full  relative">
          <div className="w-full  p-5 border-b-[1px]">
            <div className="user flex items-center justify-between">
              <div className="flex items-center  ">
                <div className=" w-10 h-10">
                  <img
                    className="w-full h-full object-cover  rounded-full"
                    src="/images/user-4.png"
                    alt="user"
                  />
                </div>
                <div className="title ms-3">
                  <h3 className="font-sans font-semibold text-xl text-black leading-[18px] capitalize  ">
                    Michael{" "}
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
          <div className="message-container h-[80vh] overflow-y-auto  px-5 py-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <Message
                  key={message}
                  text={message}
                  sender={`${message.length > 10 ? "friend" : "me"}`}
                />
              ))
            ) : (
              <p className="w-full h-full flex items-center justify-center text-2xl text-[#ddd]">
                You don't have conversasion
              </p>
            )}
          </div>
          <InputBox />
        </div>
      </div>
    </div>
  );
};

export default ChatList;
