const express = require("express");
const app = express();
const mongoose = require('mongoose');
const {User} = require("./Models/User.js")
const bcrypt = require("bcrypt")
const jwt =  require("jsonwebtoken")
const cors = require("cors")
const morgan = require("morgan")

// connecting mongoose to the local storage
mongoose.connect('mongodb://127.0.0.1:27017/ecommerceKle')
.then(()=>{
    console.log("Database is connected");
})
.catch(()=>{
    console.log("database is not connected");
})
app.use(cors())
app.use(morgan("dev"))

// use middleware => for converting string to json
app.use(express.json());

// task1 : route 1 for register


app.post("/register",async (req,res)=>{
    // when we send the using post method then the data will be in request body

    const {email,password,name} = req.body;

    if(!email || !password || !name)
    {
        res.status(400).json({message:"Fill all the fields"})
    }

    // check if user is registered or not

    const isUserAlreadyExist = await User.findOne({email})
    if(isUserAlreadyExist) 
    {

        res.status(400).json({message:"user already registered"});
        return;
    }
    else
    {
        // hashing password
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(password,salt);

        // generating JWT => superkey("string") try to sync["comapair"] with email 
        const token = jwt.sign(email,"superKey")
        {
            await User.create({
                name : name,
                email : email,
                password : hashPassword,
                token : token
            })
        }
        return res.status(201).json({message:"user created Sucessfully"})
    }
        
})

// task2  :route 2 for login

app.post('/login',async(req,res) => {
    const {email,password} = req.body;
    const user = await user.findOne({email:email})
    if (user) {
        // if it true
        // it matches the password 
        const isPasswordMatched = bcrypt.compareSync(password,user.password) 

        if (isPasswordMatched === true) {
            res.status(200).json({
                name:user.name,
                token : user.token,
                email: user.email
            })
        
        }
        else 
        {
            res.status(400).json({message : "Password isn't match"})
        }  
    }
    else 
    {
        res.status(400).json({message : "user is not regestered.please regester"});
    }

})

app.listen(8080,()=>{
    console.log("Server get connected");   
})