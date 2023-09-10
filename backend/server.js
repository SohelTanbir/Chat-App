const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const app = express();
app.use(express.json());


const  connectDatabase =  require('./Database/databaseConnecion');

// use dotenv configuration
dotenv.config();

// database connection
connectDatabase()




// import all routes
const userRoutes = require('./routes/userRoutes');


// user routes
app.use("/api/v1", userRoutes)






// listen server  on port 
app.listen(process.env.PORT || 5500, ()=>{
    console.log(`Seerver listening on port ${process.env.PORT || 5500}`);
})


















