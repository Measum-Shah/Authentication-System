import express from "express"
import { config } from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"
import userRouter from "./routes/userRouter.js"
import { connection } from './database/dbConnection.js'

export const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

// dotenv configuration
config({
  path: './config.env'
});


// cors configuration
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // allow all origins
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));




// routes
app.use('/api/v1/user',userRouter)

// db connection
connection()