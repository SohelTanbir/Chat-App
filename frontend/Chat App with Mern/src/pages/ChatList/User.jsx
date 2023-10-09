
const User = ({avatar, name, message, time}) => {
    return (
        <div className="user flex items-center justify-between cursor-pointer hover:bg-[#05c46b] py-4 px-5 rounded-sm border-b-[1px] border-[#F6F5F7]">
        <div className="flex items-center  ">
            <div className=" w-8 h-8">
                <img className="w-full h-full object-cover  rounded-full" src={avatar} alt={name}/>
            </div>
        <div className="title ms-3">
                <h3 className="font-sans font-semibold text-lg text-[#6d6d6d] leading-[18px]   ">{name?name:'User'}</h3>
                <p className="font-sans font-normal text-[14px] text-[#989898]   ">{message}</p>
        </div>
        </div>
        <div className="text-[#989898] text-sm">
            <span>{time}</span>
        </div>
    </div>
    );
};

export default User;