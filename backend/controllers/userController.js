const User = require('../models/userModel');
const bcrypt = require('bcrypt');


// create a new user
const createUser = async (req, res)=>{
    const {username, email, password, role} = req.body;
    if(!username || !email || !password){
        res.status(201).json({
            success:false,
            message:'Username, email and password are required',
        });
        return;
    }

    // check already exists user with this email address
    const userExist = await User.find({email});
    if(userExist.length > 0) {
        res.status(201).json({
            success:false,
            message:'User already exists with this email address!',
        });
        return;
    }


    const salt = await bcrypt.genSalt(10);
    const hasPassword = await bcrypt.hash(password, salt);
    const userData = {
        username, 
        email, 
        role,
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
            message:'User created successfully',
            user:result
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