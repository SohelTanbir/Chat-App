const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const  connectDatabase =  require('./Database/databaseConnecion');

// use dotenv configuration
dotenv.config();

// database connection
connectDatabase()




// import all routes
const userRoutes = require('./routes/userRoutes');
const chatRoute = require('./routes/chatRoute');
const messageRoute = require('./routes/messageRoute');


// user routes
app.use("/api/v1", userRoutes);

// chat routes
app.use("/api/v1", chatRoute);

// message routes
app.use("/api/v1", messageRoute );






// default Error Handler
const errorHandler  = (err, req, res, next)=>{
    if(req.headersSent){
         return next(err.message);
    }
    res.status(500).json({
        success:false,
        message:err
    })
 }

 app.use(errorHandler);



// listen server  on port 
app.listen(process.env.PORT || 5500, ()=>{
    console.log(`Seerver listening on port ${process.env.PORT || 5500}`);
})


















