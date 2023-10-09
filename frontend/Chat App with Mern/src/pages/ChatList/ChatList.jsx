import { FaPen, FaSearch, } from 'react-icons/fa';
import User from './User';


const ChatList = () => {
    return (
        <div className="max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between">
                <div className="chats-sidebar max-w-[400px] w-full">
                    <div className="chats-header bg-[#009432] p-5">
                        <div className="user mb-5 flex items-center justify-between">
                            <div className="flex items-center  ">
                                <div className=" w-10 h-10">
                                    <img className="w-full h-full object-cover  rounded-full" src="/images/sohelrana.jpg" alt="user" />
                                </div>
                            <div className="title ms-3">
                                    <h3 className="font-sans font-semibold text-xl text-[#d9dee0] leading-[18px]  uppercase  ">Thomas</h3>
                                    <p className="font-sans font-normal text-[12px] text-[#d9dee0]   ">Software Developer</p>
                            </div>
                            </div>
                            <div className="user-update text-[#e5e7eb] cursor-pointer hover:text-primary">
                            <FaPen />
                            </div>
                        </div>
                        <form className='relative'>
                            <input type="text" className="bg-[#fff] w-full py-[4px] ps-10  rounded-md focus:outline-none" placeholder="Search" />
                            <span className='text-md text-[#c6c6c6] absolute left-[12px] top-[8px]'>
                                <FaSearch />
                            </span>
                        </form>
                    </div>
                  <div className="chat-lists w-full h-[85vh] bg-white overflow-x-auto">
                      <User avatar="/images/user-2.png" name="John" message="Hi, how are you?"  time="10:10PM"/>

                      <User avatar="/images/user-3.png" name="Jessica" message="Hello Jessica"  time="12:10AM"/>

                      <User avatar="/images/user-4.png" name="William" message="Hi, how are you?"  time="09:10PM"/>

                      <User avatar="/images/user-5.png" name="David" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-6.png" name="Joseph" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-7.png" name="Benjamin" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-8.png" name="Olivia" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-9.png" name="Thomas" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-10.png" name="Sophia" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-11.png" name="Sohel Tanvir" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-12.png" name="Hussain   Ahmed" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-13.png" name="Shahid" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-14.png" name="Kamal" message="Hi, how are you?"  time="11:30PM"/>

                      <User avatar="/images/user-15.png" name="Zoe" message="What's up? How's your day been so far?"  time="11:30PM"/>

                      <User avatar="/images/user-16.png" name="Samuel" message="Tomar basa kothai?"  time="11:30PM"/>


                  </div>
                
                </div>
                <div className="chats-body w-full  p-5">
                        <h1>Chat body</h1>
                </div>
            </div>
        </div>
    );
};

export default ChatList;