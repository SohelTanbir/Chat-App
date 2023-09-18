const mongoose =  require('mongoose');

const chatSchema = mongoose.Schema({
    friends:{
            type: Array,
            senderId: String,
            receiver: String,
            requered:true,       
        },
},
{
    timestamps:true,
}
);


module.exports  = mongoose.model('chat', chatSchema);