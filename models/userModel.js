import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
 maxLength: [32,'Pasword cannot have more than 32 characters'],
  minLength: [8,'Pasword Must have atleast 8 characters'],
  required: true,
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
    next()
  }
  this.password = await bcrypt.hash(this.password,10)
})

userSchema.methods.comparePassword = async function(enteredPassword){
  return await bcrypt.compare(enteredPassword,this.password)
}
  
userSchema.methods.generateverificationCode = function(){
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




export const User = mongoose.model("User", userSchema)