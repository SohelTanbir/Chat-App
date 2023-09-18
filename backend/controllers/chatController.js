const ChatModel = require('../models/chatModel');

// create a new chat
const createChat =  async (req, res,) => {
    const {senderId, receiverId } = req.body;
   if(!senderId || !receiverId){
        res.status(201).json({
            success:false,
            message:'Sender Id and Receiver Id are required',
        });
        return;
    }
    // Check already exists chat 
    const isChatExists = await ChatModel.findOne({friends:{$all:[senderId,receiverId]}})
   if(isChatExists){
        return res.status(201).json({
            success:false,
            message:'Chat already exists with this users!',
        });
   }
   
    const newChat = new ChatModel({friends:[senderId,receiverId]});
    try {
    const result =  await newChat.save();
    if(!result){
      return res.status(201).json({
            success:false,
            message:'There was an server error',
        });
    }
        res.status(201).json({
            success:true,
            message:'Chat created successfully',
        });
    } catch (err) {
        console.log(err);
    }
}


// export chat controller
module.exports = {
    createChat
}