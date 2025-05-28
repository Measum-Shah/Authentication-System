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

    //  function sendVerificationCode(verificationMethod,verificationCode,email,password){
    //   res.status(200).json({
    //     success:true,
    //   })
    //  }


  } catch (error) {
     next( error);
  }


} )

async function sendVerificationCode(verificationMethod,verificationCode,email,password){
  if(verificationMethod == "email"){
    const message = generateEmailTemplate(verificationCode);
    sendEmail({email,subject:"Your Verification Code",message})
  }
}

function generateEmailTemplate(verificationCode){
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#fff;border:1px solid #ddd;border-radius:8px;">
  <div style="font-size:18px;font-weight:bold;margin-bottom:10px;color:#333;">Email Verification</div>

  <div style="font-size:14px;margin-bottom:15px;color:#555;">
    Thank you for registering. Use the following verification code:
  </div>

  <div style="font-size:22px;letter-spacing:4px;padding:10px 20px;background:#f0f0f0;color:#000;border-radius:5px;display:inline-block;margin-bottom:15px;">
    ${verificationCode}
  </div>

  <div style="font-size:12px;color:#888;">
    This code is valid for 10 minutes. If you did not request this email, please ignore it.
  </div>
</div>`

}
