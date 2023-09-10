const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const app = express();


const  connectDatabase =  require('./Database/databaseConnecion');

// use dotenv configuration
dotenv.config();

// database connection
connectDatabase()





// routes
app.get("/", function(req, res) {
    res.status(200).json({
        success:true,
        message:"Wecome to Chat Application"
    })
})





// listen server  on port 
app.listen(process.env.PORT || 5500, ()=>{
    console.log(`Seerver listening on port ${process.env.PORT || 5500}`);
})


















