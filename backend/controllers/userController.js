const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// create a new user
const createUser = async (req, res)=>{
    const {name, email, password, role} = req.body;
    if(!name || !email || !password){
        res.status(201).json({
            success:false,
            message:'Name, email and password are required',
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
        name, 
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

// Login user
const LoginUser = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        res.status(201).json({
            success:false,
            message:'Email and password are required',
        });
        return;
    }

    try {
        // check already exists user with this email address
    const user = await User.find({email});
    console.log(user)
    if(!user.length > 0) {
        return res.status(201).json({
            success:false,
            message:"User not found!",
        });
    }
    // check  password is correct or not
    const isPasswordsCorrect =  await bcrypt.compare(password, user[0].password);
    if(!isPasswordsCorrect){
       return res.status(201).json({
            success:false,
            message:"Incorrect email or password !",
        });
    }
    // generate auth token
    const token = jwt.sign({email,userId:user[0]._id}, process.env.JWT_SECREAT,{ expiresIn: '1h' });
    res.status(201).json({
        success:true,
        message:"Login success",
        token,
        userData:{
            userId: user[0]._id,
          name: user[0].name,
          email
        }
    });

    } catch (err) {
        res.status(201).json({
            success:false,
            error:err.message,
        });
    }





}




// export controllers
module.exports = {
    createUser,
    LoginUser
}