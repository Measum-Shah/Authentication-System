import mongoose from "mongoose";

export const connection = async()=>{
  mongoose.connect(process.env.MONGO_URI,{
    dbName:process.env.DB_NAME,
}).then(()=>{
  console.log("Connected to database.")
}).catch((err)=>{
  console.log(`An error occured while connecting to database ${err}`)
})
}