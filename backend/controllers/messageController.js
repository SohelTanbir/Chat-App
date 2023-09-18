const MessageModel = require('../models/messageModel');


// add a new message
const createMessage = async (req, res)=>{
    const {chatId, senderId, message } =  req.body;
    if(!chatId || ! senderId || ! message){
        return res.status(201).json({
            success:false,
            message:'Sender, Receiver and Chat id are required',
        });
    }
    const newMessage = await MessageModel({chatId, senderId, message});
   try {
    const result =  await newMessage.save();
    if(!result){
        return res.status(500).json({
              success:false,
              message:'There was an server error',
          });
      }
          res.status(201).json({
              success:true,
              message:'Message created successfully',
          });

   } catch (err) {
     res.status(500).json({
        success:false,
        message:'There was an server error!',
    });
   }


}


// export controller
module.exports = {
    createMessage,
}