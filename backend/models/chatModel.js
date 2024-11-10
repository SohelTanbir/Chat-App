const mongoose =  require('mongoose');

const chatSchema = mongoose.Schema({
    users:{
            type: Array,
            senderId: String,
            receiver: String,
            required:true,       
        },
},
{
    timestamps:true,
}
);


module.exports  = mongoose.model('chat', chatSchema);