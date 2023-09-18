const ChatModel = require('../models/chatModel');

// create a new chat
const createChat =  async (req, res,) => {
    const {senderId, receiverId } = req.body;
   if(!senderId || !receiverId){
        return res.status(400).json({
            success:false,
            message:'Sender and Receiver Id are required',
        });
    }
    // Check already exists chat 
    const isChatExists = await ChatModel.findOne({friends:{$all:[senderId,receiverId]}})
   if(isChatExists){
        return res.status(200).json({
            success:false,
            message:'Chat already exists with this user!',
        });
   }
   
    const newChat = new ChatModel({friends:[senderId,receiverId]});
    try {
    const result =  await newChat.save();
    if(!result){
      return res.status(500).json({
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

// find specific user chat by user id
const findChat = async (req, res) => {
    const {userId, friendId } = req.params;
    console.log(req.params)
    if(!userId || !friendId){
         return res.status(400).json({
             success:false,
             message:'Sender and Receiver Id are required ss',
         });
     }
     try {
            // Check already exists chat 
    const userChat = await ChatModel.findOne({friends:{$all:[userId,friendId]}})
    if(!userChat){
         return res.status(400).json({
             success:false,
             message:'Sender or Reciever id incorrect!',
         });
    }
    res.status(200).json({
        success:true,
        userChat
    });

     } catch (err) {
         res.status(500).json({
            success:false,
            message:err.message,
        });
     }
}


// export chat controller
module.exports = {
    createChat,
    findChat
}