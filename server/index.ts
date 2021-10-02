import dotenv from 'dotenv'
dotenv.config()

import express, {Application, Request, Response} from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

// Database
import './config/database'
import routes from "./routes";

// Middleware
const app: any = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser())


// Routes
app.use('/api/auth', routes.authRouter)

// server listening
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log('Server is running on port', PORT)
})
