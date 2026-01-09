const mongoose=require("mongoose")
const userSchema=new mongoose.Schema(
    {
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        username:{
            type:String,
            required:true,
            unique:true,
            trim:true

        },
        password:{
            type:String,
            required:true,
            minlength:8,
        },
        isOnline:{
            type:String,
            default:null
        },
        socketId:{
            type:String,
            default:null
        },

    },
    { timestamps: true }
)
module.exports=mongoose.model("user",userSchema)