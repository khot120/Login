const mongoose = require("mongoose");

const user_schema = new mongoose.Schema({
    // Schama templete 
    email : {
        type : String,
        required:true
    },
    password : {
        type : String,
        required : true
    },
    name : {
        type : String,
        required : true
    },
    // act like a primary key
    token : {
        type  : String,
        required : true
    }
    
});
// collection 
const User = mongoose.model("User",user_schema) 

module.exports = {User};