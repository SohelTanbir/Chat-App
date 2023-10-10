
const Message = ({text, sender}) => {
    return (
        <div className={`${sender == 'friend'?'friend-message':'my-message'}  max-w-[350px] mb-3 p-3`}>
            <p className='m-0 text-white font-normal'>{text}</p>
            <small className=" text-[#d9dee0] font-normal text-[12px] text-end block">7:55PM</small>
        </div>
    );
};

export default Message;