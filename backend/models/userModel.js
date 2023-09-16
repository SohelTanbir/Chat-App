const mongoose = require('mongoose');

const userSchema =  mongoose.Schema({
    username:{
        type: String,
        trim:true,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    photo:{
        typeof: String,
    },
    role:{
        type:String,
        required:true,
        enum:["admin", "user"],
        default:"user",
    },
    createdAt:{
        type: Date,
        default: Date.now(),
    }
})

// create model instance
module.exports = mongoose.model("user", userSchema);
