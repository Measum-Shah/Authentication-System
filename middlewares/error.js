class ErrorHandler extends Error  {
  constructor(message,statusCode){
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleWare = (err,req,res,next) =>{
  err.statusCode = err.statusCode || 500;
  err.message - err.message || "Internal Server Error";

  if(err.name=== "CastError"){
    const message = `Invalid ${err.path}`;
    err = new ErrorHandler(message,400);
  }

  if(err.name=== "JsonWebTokenError"){
    const message = `Json Web Token is Invalid, Try Again`;
    err = new ErrorHandler(message,400);
  }

  if(err.name=== "TokenExpiredError"){
    const message = `json web token is expired, try again`;
    err = new ErrorHandler(message,400);
  }

  if(err.code === 11000){
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ErrorHandler(message,400);
  }

 return res.status(err.statusCode).json({
  success: false,
  message:err.message,
 })
}