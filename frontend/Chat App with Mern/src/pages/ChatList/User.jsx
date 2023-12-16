const User = ({ user, handleStartConversation, selectedUser }) => {
  return (
    <div
      onClick={() => handleStartConversation(user)}
      className={`${
        selectedUser._id == user._id ? "selecatedUser" : ""
      } user flex items-center justify-between cursor-pointer   hover:bg-[#fbfbfb] py-4 px-5 rounded-sm border-b-[1px] border-[#F6F5F7] select-none`}
    >
      <div className="flex items-center  ">
        <div className=" w-8 h-8">
          <img
            className="w-full h-full object-cover  rounded-full"
            src={user.photo.url ? user.photo.url : "/images/user-default.png"}
            alt={user.name}
          />
        </div>
        <div className="title ms-3">
          <h3 className="font-sans font-semibold text-lg text-[#6d6d6d] leading-[18px]   ">
            {user.name ? user.name : "User"}
          </h3>
          <p className="font-sans font-normal text-[14px] text-[#989898]   ">
            Hello everyone
          </p>
        </div>
      </div>
      <div className="text-[#989898] text-sm">
        <span>10:32 PM</span>
      </div>
    </div>
  );
};

export default User;
