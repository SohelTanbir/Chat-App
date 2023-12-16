const mongoose =  require('mongoose');

const chatSchema = mongoose.Schema({
    users:{
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