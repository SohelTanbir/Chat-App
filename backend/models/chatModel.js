const mongoose =  require('moongose');

const chatSchema = mongoose.Schema({
    friends:[
        {
            type: Array,
            senderId: String,
            reciverId: String,
            requered:true,       
        },

    ]
},
{
    timestamps:true,
}
);


module.exports  = mongoose.model('chat', chatSchema);