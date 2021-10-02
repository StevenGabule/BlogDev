import dotenv from 'dotenv'

dotenv.config();

import {Request, Response} from 'express'
import User from '../models/user.model'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {generateAccessToken, generateActiveToken, generateRefreshToken} from "../config/generateToken";
import {validEmail, validPhone} from "../middleware/valid";
import sendEmail from "../config/sendMail";
import {sendSms} from "../config/sendSMS";
import {IDecodedToken, IUser} from "../config/interface";

const CLIENT_URL = process.env.BASE_URL

const authCtrl = {
  register: async (req: Request, res: Response) => {
    try {
      const {name, account, password} = req.body;
      const user = await User.findOne({account});
      if (user) return res.status(400).json({msg: 'Email or phone number is already in used.'})
      const passwordHash = await bcrypt.hash(password, 12)

      const newUser = {name, account, password: passwordHash}
      const ACTIVE_TOKEN = generateActiveToken({newUser})
      const url = `${CLIENT_URL}/active/${ACTIVE_TOKEN}`

      if (validEmail(account)) {
        await sendEmail(account, url, 'Verify your email address')
        res.status(201).json({
          msg: "Verify your email address.",
        })
      } else if (validPhone(account)) {
        await sendSms(account, url, 'Verify your phone number')
        res.status(201).json({
          msg: "Verify your phone number.",
        })
      }
    } catch (e: any) {
      res.status(400).json({msg: e.message})
    }
  },
  activeAccount: async (req: Request, res: Response) => {
    try {
      const {active_token} = req.body;
      const decoded = <IDecodedToken>jwt.verify(active_token, `${process.env.ACTIVE_TOKEN_SECRET}`)
      const {newUser} = decoded;

      if (!newUser) return res.status(400).json({msg: "Invalid authentication."})
      const user = new User(newUser)
      await user.save()
      return res.status(201).json({msg: 'Account has been activated!'})
    } catch (e: any) {
      console.log(e)
      let errMsg;
      if (e.code === 11000) {
        errMsg = Object.keys(e.keyValue)[0] + " already exists."
      } else {
        console.log(e)
        let name = Object.keys(e.errors)[0]
        errMsg = e.errors[`${name}`].message;
      }
      return res.status(500).json({msg: errMsg})
    }
  },
  login: async (req: Request, res: Response) => {
    try {
      const {account, password} = req.body;
      const user = await User.findOne({account});
      if (!user) return res.status(400).json({msg: 'This account does not exists.'})
      await loginUser(user, password, res)
    } catch (e: any) {
      res.status(400).json({msg: e.message})
    }
  },
  logout: async (req: Request, res: Response) => {
    try {
      res.clearCookie('refreshtoken', {path: `/api/auth/refresh_token`});
      return res.json({msg: 'Logged out!'})
    } catch (e: any) {
      res.status(400).json({msg: e.message})
    }
  },
  refreshToken: async (req: Request, res: Response) => {
    try {
      console.log(req.cookies)
      const rf_token = req.cookies.refreshtoken
      if (!rf_token)return res.status(400).json({msg: 'Please login now!'})

      const decoded = <IDecodedToken>jwt.verify(rf_token, `${process.env.REFRESH_TOKEN_SECRET}`)

      if(!decoded.id) return res.status(400).json({msg: 'Please login now!'})

      const user = await User.findById(decoded.id).select('-password')

      if (!user) return res.status(400).json({msg: 'This account doest not exists.'})

      const access_token = generateAccessToken({id: user._id,})

      res.json({access_token})

    } catch (e: any) {
      res.status(400).json({msg: e.message})
    }
  },
}

const loginUser = async (user: IUser, password: string, res: Response) => {
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return res.status(400).json({msg: 'Password is incorrect'})

  const access_token = generateAccessToken({id: user._id})
  const refresh_token = generateRefreshToken({id: user._id})

  res.cookie('refreshtoken', refresh_token, {
    httpOnly: true,
    path: `/api/auth/refresh_token`,
    maxAge: 30 * 24 * 60 * 60 * 1000
  })

  res.json({
    msg: 'Login success!',
    access_token,
    user: {...user._doc, password: ''}
  })
}

export default authCtrl;
