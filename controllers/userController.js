import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError
 } from "../middlewares/catchAsyncError";
import { User } from "../models/userModel.js";

export const register = catchAsyncError(async (req,res,next) =>{
  try {
    const {name,email,phone,password,verificationMethod} = req.body;

    // Checking All Fields
    if(!name|| !email ||!phone || !password || !verificationMethod)
      {
        return next(new ErrorHandler("All fields are required",400))
      }
    
    // Validating Phone Number
     function validatePhoneNumber(phone){
      const phoneRegex = /^+923\d{9}$/ ;
      return phoneRegex.test(phone)
     } 
     if(!validatePhoneNumber(phone)){
      return new ErrorHandler("Invalid Phone Number",400)
     }

    // checking User Phone or Email is already verified or not
     const existingUser = await User.findOne({
      $or:[
       {email,
        accountVerified: true,
      },
      { phone,
        accountVerified: true,
      } ]
     });

     if(existingUser){
      return next(new ErrorHandler("Phone or Email is already used", 400))
     }

    //  restricting registration attempts, if unsuccessful
     const registrationAttemptsByUser = await User.find({
      $or:[
        {phone,accountVerified: false},
        {email,accountVerified: false}
      ]
     });

     if(registrationAttemptsByUser.length > 3 ){
      return next(new ErrorHandler("You have exceeded the maximum number of attempts (3) so try again after an hour"),400)
     };

    //saving user data to db
     const userData = {
      name,
      email,
      phone,
      password,
     }

     const user = await user.create(userData);
     const verificationCode = await user.generateVerificationCode();
     await user.save();


  } catch (error) {
    
  }
} )
