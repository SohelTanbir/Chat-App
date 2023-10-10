import { FaPen, FaPhoneAlt, FaSearch, FaVideo } from 'react-icons/fa';
import User from './User';
import Message from '../../components/Message/Message';


const ChatList = () => {
    return (
        <div className="max-w-[1600px] w-full mx-auto bg-[#ffffff] mt-5">
            <div className="flex justify-between">
                <div className="chats-sidebar max-w-[400px] w-full">
                    <div className="chats-header bg-[#009432] p-5">
                        <div className="user mb-5 flex items-center justify-between">
                            <div className="flex items-center  ">
                                <div className=" w-10 h-10">
                                    <img className="w-full h-full object-cover  rounded-full" src="/images/sohelrana.jpg" alt="user" />
                                </div>
                            <div className="title ms-3">
                                    <h3 className="font-sans font-semibold text-xl text-[#d9dee0] leading-[18px]  uppercase  ">Sohel Rana</h3>
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
                  <div className="chat-lists w-full h-[80vh] bg-white overflow-x-auto border-e-[1px]">
                      <User avatar="/images/user-2.png" name="John" message="Hi, how are you?"  time="10:10PM"/>

                      <User avatar="/images/user-3.png" name="Jessica" message="Hello Jessica"  time="12:10AM" />

                      <User avatar="/images/user-4.png" name="Michael" message="Hey, your name please?"  time="09:10PM"/>

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
                <div className="chats-body  w-full  relative">
                        <div className="w-full  p-5 border-b-[1px]">
                            <div className="user flex items-center justify-between">
                                <div className="flex items-center  ">
                                    <div className=" w-10 h-10">
                                        <img className="w-full h-full object-cover  rounded-full" src="/images/user-4.png" alt="user" />
                                    </div>
                                <div className="title ms-3">
                                        <h3 className="font-sans font-semibold text-xl text-black leading-[18px] capitalize  ">Michael   </h3>
                                </div>
                                </div>
                                <div className="user-update text-[#009432] cursor-pointer  flex items-center text-xl pr-5">
                                    <span className='ms-8  hover:text-primary'>
                                    <FaPhoneAlt />
                                    </span>
                                    <span className='ms-8 hover:text-primary'>
                                    <FaVideo />
                                    </span>
                                </div>
                            </div>
                        </div>
                      <div className="message-container h-[80vh] overflow-y-auto  px-5 py-4">

                        <Message text="Hi, Sohel Rana" sender="friend"/>
                        <Message text="Hi, Michael, How are you ?" sender="me"/>
                        <Message text="Hi, Michael, How are you ?" sender="me"/>
                        <Message text="Hi, Michael, How are you ?" sender="me"/>
                        <Message text="Hi, Sohel Rana" sender="friend"/>

                        <Message text="Hi, Sohel Rana" sender="friend"/>
                        <Message text="Hi, Michael, How are you ?" sender="me"/>
                        <Message text="Hi, Michael, How are you ?" sender="me"/>
                        <Message text="Hi, Michael, How are you ?" sender="me"/>

                        <Message text="Hi, Sohel Rana" sender="friend"/>
                        <Message text="Hi, Sohel Rana" sender="friend"/>

                        <Message text="Hi, Michael, How are you ?" sender="me"/>


                        <Message text="Hi, Sohel Rana" sender="friend"/>
                        <Message text="Hi, Sohel Rana" sender="friend"/>
                        <Message text="Hi, Sohel Rana" sender="friend"/>
                        <Message text="Hi, Sohel Rana" sender="friend"/>
                      </div>
                      <div className="message-input w-full bg-[#009432] py-2 px-5">
                      <form className='flex items-center justify-between relative' >
                            <input type="text" className='w-[95%]   p-2 ps-12  rounded-md focus:outline-none' placeholder='Message to Michael'/>
    
                            <div className="emoji  absolute left-[12px] top-[8px] cursor-pointer " onClick={()=> alert(" Emoji")}>
                            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet"  version="1.1" x="0px" y="0px" enable-background="new 0 0 24 24" xml:space="preserve"><path fill="currentColor" d="M9.153,11.603c0.795,0,1.439-0.879,1.439-1.962S9.948,7.679,9.153,7.679 S7.714,8.558,7.714,9.641S8.358,11.603,9.153,11.603z M5.949,12.965c-0.026-0.307-0.131,5.218,6.063,5.551 c6.066-0.25,6.066-5.551,6.066-5.551C12,14.381,5.949,12.965,5.949,12.965z M17.312,14.073c0,0-0.669,1.959-5.051,1.959 c-3.505,0-5.388-1.164-5.607-1.959C6.654,14.073,12.566,15.128,17.312,14.073z M11.804,1.011c-6.195,0-10.826,5.022-10.826,11.217 s4.826,10.761,11.021,10.761S23.02,18.423,23.02,12.228C23.021,6.033,17.999,1.011,11.804,1.011z M12,21.354 c-5.273,0-9.381-3.886-9.381-9.159s3.942-9.548,9.215-9.548s9.548,4.275,9.548,9.548C21.381,17.467,17.273,21.354,12,21.354z  M15.108,11.603c0.795,0,1.439-0.879,1.439-1.962s-0.644-1.962-1.439-1.962s-1.439,0.879-1.439,1.962S14.313,11.603,15.108,11.603z"></path></svg>
                            </div>
                            <button className='text-2xl text-white ms-5'> 
                             <svg width="30px" height="30px" viewBox="0 0 24 24" fill='#F3F3F3' enableBackground="blue" xmlns="http://www.w3.org/2000/svg"><path d="M2.996 12.5l-1.157 8.821 20.95-8.821-20.95-8.821zm16.028-.5H3.939l-.882-6.724zM3.939 13h15.085L3.057 19.724z"/><path fill="none" d="M0 0h24v24H0z"/></svg>
                             
                            </button>
                        </form>
                      </div>
                </div>
            </div>
        </div>
    );
};

export default ChatList;