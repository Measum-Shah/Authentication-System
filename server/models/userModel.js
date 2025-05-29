import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
name: {
  type: String,
  required: true,
},

email: {
  type: String,
  required: true,
},

password: {
  type: String,
  minLength: [8,'Pasword Must have atleast 8 characters'],
  required: true,
  select:false,
},

phone:{
  type:String,
},

accountVerified:{
 type: Boolean,
 default:false,
},

verificationCode:{
  type:Number,
},

verificationCodeExpire:{
  type: Date,
},

resetPasswordToken:{
  type:String,
},

resetPasswordExpire:{
  type:Date,
},

createdAt:{
  type:Date,
  default:Date.now,
},
});
  


userSchema.pre("save", async function(next){
  if(!this.isModified("password")){
    return next(); // Important to stop further execution if password is unchanged
  }
  this.password = await bcrypt.hash(this.password, 10);
  next(); // call next after hashing is done
});

userSchema.methods.comparePassword = async function (enteredPassword) {

  return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.generateVerificationCode = function(){
  function generateRandomFiveDigitNumber(){
    const firstDigit = Math.floor(Math.random() * 9 + 1)
    const remainingDigits = Math.floor(Math.random() * 10000).toString().padStart(4,0)
    return parseInt(firstDigit+remainingDigits);
  }

  const verificationCode = generateRandomFiveDigitNumber();

  this.verificationCode = verificationCode;

  this.verificationCodeExpire =Date.now() + (10*60*1000)

  return verificationCode;
} 

userSchema.methods.generateToken = async function(){
return await jwt.sign({id:this._id},
  process.env.JWT_SECRET_KEY,{
    expiresIn: process.env.JWT_EXPIRE
  }
)

}




export const User = mongoose.model("User", userSchema)