const User = require('../models/userModel');


// create a new user
const createUser = async (req, res)=>{
    const newUser  = await User.create(req.body);
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