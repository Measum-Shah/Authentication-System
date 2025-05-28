import express from "express"
import { config } from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"

export const app = express()

// dotenv configuration
config({
  path: './config.env'
});


// cors configuration
app.use(cors({
  origin:[process.env.FRONTEND_URL],
  methods:["GET","POST","PUT","DELETE"],
  credentials: true,
}));

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

