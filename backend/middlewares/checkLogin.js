const jwt = require("jsonwebtoken");

const checkLogin = (req, res, next)=>{

    const BearerToken = req.header("Authorization");


    if(BearerToken == undefined || BearerToken =='') {
      next("Authentication is required!");0
      return
  }
  try {
    const token =  BearerToken.split(" ")[1];
     const {email, userId} = jwt.verify(token, process.env.JWT_SECREAT);
     req.email = email;
     req.userId = userId;
     next();
  } catch (err) {
    next("Your token invalid or  has expired !");
  }

}

// export module
module.exports = checkLogin;


















