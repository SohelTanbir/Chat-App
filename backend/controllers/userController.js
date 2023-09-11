const User = require('../models/userModel');
const bcrypt = require('bcrypt');


// create a new user
const createUser = async (req, res)=>{
    const {username, email, password} = req.body;
    if(!username && !email && !password){
        return;
    }
    const salt = await bcrypt.genSalt(10);
    const hasPassword = await bcrypt.hash(password, salt);
    const userData = {
        username, 
        email, 
        password:hasPassword
    }
    const newUser  = await User.create(userData);
    try {
       const result = await  newUser.save();
        if(!result){
            res.status(500).json({
                success:false,
                message:'User created Failed!'
            })
        }else{
        res.status(201).json({
            success:true,
            message:'User created successfully'
        })
        }
    } catch (error) {
        res.status(500).json({
            success:false,
            message:'There was an server error!'
        })
    }
}




// export controllers
module.exports = {
    createUser
}