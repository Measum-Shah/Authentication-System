import {ErrorHandler} from "../middlewares/error.js";
import { catchAsyncError} from "../middlewares/catchAsyncError.js";
import { User } from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import twilio from "twilio"
import { sendToken } from './../utils/sendToken.js';





export const register = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, phone, password, verificationMethod } = req.body;
    

    // Checking All Fields
    if (!name || !email || !phone || !password || !verificationMethod) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    // Validating Phone Number
    // function validatePhoneNumber(phone) {
    //   const phoneRegex = /^\+923\d{9}$/;
    //   return phoneRegex.test(phone);
    // }
    // if (!validatePhoneNumber(phone)) {
    //   return next(new ErrorHandler("Invalid Phone Number", 400));
    // }

    // checking User Phone or Email is already verified or not
    const existingUser = await User.findOne({
      $or: [
        {
          email,
          accountVerified: true,
        },
        {
          phone,
          accountVerified: true,
        },
      ],
    });

    if (existingUser) {
      return next(new ErrorHandler("Phone or Email is already used", 400));
    }

    //  restricting registration attempts, if unsuccessful
    const registrationAttemptsByUser = await User.find({
      $or: [
        { phone, accountVerified: false },
        { email, accountVerified: false },
      ],
    });

    if (registrationAttemptsByUser.length > 3) {
      return next(
        new ErrorHandler(
          "You have exceeded the maximum number of attempts (3) so try again after an hour",
          400
        )
      );
    }

    //saving user data to db
    const userData = {
      name,
      email,
      phone,
      password,
    };

    const user = await User.create(userData); // ✅ Fixed from user.create to User.create
    const verificationCode = await user.generateVerificationCode();
    await user.save();

     sendVerificationCode(verificationMethod,verificationCode,email,password,res,name,phone)     

  } catch (error) {
    next(error);
  }
});


async function sendVerificationCode(verificationMethod,verificationCode,email,password,res,name,phone){
  

  try{
  if(verificationMethod == "email"){
    const message = generateEmailTemplate(verificationCode);
    sendEmail({email,subject:"Your Verification Code",message})
    res.status(200).json({
      success:true,
      "message": `verification email sent successfully to ${email} of user ${name}`
    })
  } 
  else if (verificationMethod === "phone") {
    const verificationCodeWithSpace = verificationCode.toString().split("").join(" ");

    // twilio setup
const client = twilio(process.env.TWILIO_SID,process.env.TWILIO_AUTH_TOKEN )

    await client.calls.create({
      twiml: `
        <Response>
          <Say>
            Your verification code is ${verificationCodeWithSpace}.
          </Say> 
        </Response>`,
      from: process.env.TWILIO_PHONE_NO,
      to: phone,

    });
  
    res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });
  }
  
  else{
    return res.status(500).json({
      success:false,
      message:"invalid verification method"
    })
  }
  }
  catch(error){
    return res.status(500).json({
      success:false,
      message:`verification code failed to send due to ${error} to ${phone} of ${name}`
    })
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


// verify otp function

// ✅ Corrected version with comments

export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp, phone } = req.body;

  // you can do phone validation here

  try {
    // ✅ Correction: added proper logical check for entries of unverified users by email or phone
    const userAllEntries = await User.find({
      $or: [
        { email, accountVerified: false },
        { phone, accountVerified: false }
      ]
    }).sort({ createdAt: -1 });

    // ❌ FIXED: userAllEntries is an array. `if(!userAllEntries)` would always be false for non-null arrays.
    // ✅ Correct: check if array is empty
    if (userAllEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let user;

    // ❌ FIXED: `userAllEntries > 1` is incorrect because `userAllEntries` is an array.
    // ✅ Correct: check `length`
    if (userAllEntries.length > 1) {
      user = userAllEntries[0];

      // ❌ FIXED: `_dd` is incorrect. Probably meant `_id`
      // ✅ Correct: should be `_id`
      await User.deleteMany({
        _id: { $ne: user._id },
        $or: [
          { phone, accountVerified: false },
          { email, accountVerified: false }
        ]
      });
    } else {
      // if user has requested only one otp
      user = userAllEntries[0];
    }

    // ❌ FIXED: `user.verificationCode!== Number(otp)` - comparison is fine, but should handle `NaN`
    if (Number(user.verificationCode) !== Number(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    const currentTime = Date.now();

    // ❌ FIXED: `verficationCodeExpire` is misspelled in the database field name
    // ✅ Correct: changed to `verificationCodeExpire`
    const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();

    // console.log(currentTime);
    // console.log(verificationCodeExpire);

    if (currentTime > verificationCodeExpire) {
      return next(new ErrorHandler("OTP Expired", 400));
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;

    await user.save({
      validateModifiedOnly: true,
      phone,
    });

    // from utils folder
    sendToken(user, 200, "Account Verified", res);
  } catch (error) {
    return next(new ErrorHandler(`Internal Server Error due to ${error}`));
  }
});


// login
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // ✅ Validate input
  if (!email || !password || typeof password !== "string") {
    return next(new ErrorHandler("Valid Email and Password are required", 400));
  }
  

  // ✅ Find user and explicitly include password (since it's select: false in schema)
  const user = await User.findOne({ email, accountVerified: true }).select("+password");

  // ✅ Check if user exists
  if (!user) {
    return next(new ErrorHandler("Invalid Email or password", 400));
  }

  // ✅ Compare passwords using method from schema
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or password", 400));
  }

  // ✅ Send JWT token in cookie + response
  sendToken(user, 200, "User Logged in successfully", res);
});


// logout
export const logout = catchAsyncError(async(req,res,next)=>{
  res.status(200).cookie("authToken","",{
    expires: new Date(Date.now() + (Number(process.env.COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
    }).json({
      success:true,
      message:"user logged out successfully"
    })
})