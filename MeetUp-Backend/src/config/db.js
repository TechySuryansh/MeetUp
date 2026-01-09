const mongoose=require("mongoose")
const dotenv = require("dotenv")
dotenv.config()

function dbConnect(){
    try{
        mongoose.connect(process.env.MONGO_URI)
        console.log("Database Connected")
    }catch(err){
        console.log(err)
    }
}

module.exports = dbConnect