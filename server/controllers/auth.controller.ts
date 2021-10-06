import dotenv from 'dotenv'

dotenv.config();

import {Request, Response} from 'express'
import User from '../models/user.model'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {generateAccessToken, generateActiveToken, generateRefreshToken} from "../config/generateToken";
import {validEmail, validPhone} from "../middleware/valid";
import sendEmail from "../config/sendMail";
import {sendSms, smsOTP, smsVerify} from "../config/sendSMS";
import {IDecodedToken, IUser, IGgPayload, IUserParams} from "../config/interface";
import fetch from 'node-fetch'
import {OAuth2Client} from 'google-auth-library'

const client = new OAuth2Client(`${process.env.MAIL_CLIENT_ID}`)

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

      const user = await User.findOne({account: newUser.account})
      if (user) return res.status(400).json({msg: 'Account already exists.'})

      const addUser = new User(newUser)
      await addUser.save()
      return res.status(201).json({msg: 'Account has been activated!'})
    } catch (e: any) {
      return res.status(500).json({msg: e.message})
    }
  },
  login: async (req: Request, res: Response) => {
    try {
      const {account, password} = req.body;
      const user = await User.findOne({account});
      if (!user) return res.status(400).json({msg: 'This account does not exists.'})
      await loginUser(user, password, res)
    } catch (e: any) {
      res.status(500).json({msg: e.message})
    }
  },
  logout: async (req: Request, res: Response) => {
    try {
      res.clearCookie('refreshtoken', {path: `/api/auth/refresh_token`});
      return res.json({msg: 'Logged out!'})
    } catch (e: any) {
      res.status(500).json({msg: e.message})
    }
  },
  refreshToken: async (req: Request, res: Response) => {
    try {
      console.log(req.cookies)
      const rf_token = req.cookies.refreshtoken
      if (!rf_token) return res.status(400).json({msg: 'Please login now!'})

      const decoded = <IDecodedToken>jwt.verify(rf_token, `${process.env.REFRESH_TOKEN_SECRET}`)

      if (!decoded.id) return res.status(400).json({msg: 'Please login now!'})

      const user = await User.findById(decoded.id).select('-password')

      if (!user) return res.status(400).json({msg: 'This account doest not exists.'})

      const access_token = generateAccessToken({id: user._id,})

      res.json({access_token, user})

    } catch (e: any) {
      res.status(500).json({msg: e.message})
    }
  },

  googleLogin: async (req: Request, res: Response) => {
    try {
      const {id_token} = req.body
      const verify = await client.verifyIdToken({
        idToken: id_token, audience: `${process.env.MAIL_CLIENT_ID}`
      })

      const {
        email, email_verified, name, picture
      } = <IGgPayload>verify.getPayload()

      if (!email_verified)
        return res.status(500).json({msg: "Email verification failed."})

      const password = email + `${process.env.MAIL_CLIENT_SECRET}`
      const passwordHash = await bcrypt.hash(password, 12)

      const user = await User.findOne({account: email})

      if (user) {
        await loginUser(user, password, res)
      } else {
        const user = {
          name,
          account: email,
          password: passwordHash,
          avatar: picture,
          type: 'google'
        }
        await registerUser(user, res)
      }

    } catch (err: any) {
      return res.status(500).json({msg: err.message})
    }
  },
  facebookLogin: async (req: Request, res: Response) => {
    try {
      const {accessToken, userID} = req.body

      const URL = `https://graph.facebook.com/v3.0/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`

      const res = await (await fetch(URL)).json();
      // .then(res => { return res })

      const {email, name, picture} = res

      const password = email + 'your facebook secret password'
      const passwordHash = await bcrypt.hash(password, 12)

      const user = await User.findOne({account: email})

      if (user) {
        await loginUser(user, password, res)
      } else {
        const user = {
          name,
          account: email,
          password: passwordHash,
          avatar: picture.data.url,
          type: 'facebook'
        }
        await registerUser(user, res)
      }

    } catch (err: any) {
      return res.status(500).json({msg: err.message})
    }
  },
  loginSMS: async (req: Request, res: Response) => {
    try {
      const {phone} = req.body
      const data = await smsOTP(phone, 'sms')
      res.json(data)
    } catch (err: any) {
      return res.status(500).json({msg: err.message})
    }
  },
  smsVerify: async (req: Request, res: Response) => {
    try {
      const {phone, code} = req.body
      const data = await smsVerify(phone, code)

      if (!data?.valid) return res.status(400).json({msg: "Invalid Authentication."})

      const password = 'password' //phone + 'your phone secret password'
      const passwordHash = await bcrypt.hash(password, 12)
      const user = await User.findOne({account: phone})
      if (user) {
        await loginUser(user, password, res)
      } else {
        const user = {
          name: phone,
          account: phone,
          password: passwordHash,
          type: 'sms'
        }
        await registerUser(user, res)
      }
    } catch (err: any) {
      return res.status(500).json({msg: err.message})
    }
  },
}

const loginUser = async (user: IUser, password: string, res: Response) => {
  const isMatch = await bcrypt.compare(password, user.password)
  if(!isMatch) {
    let msgError = user.type === 'register'
      ? 'Password is incorrect.'
      : `Password is incorrect. This account login with ${user.type}`

    return res.status(400).json({ msg: msgError })
  }

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

const registerUser = async (user: IUserParams, res: Response) => {
  const newUser = new User(user)
  await newUser.save()

  const access_token = generateAccessToken({id: newUser._id})
  const refresh_token = generateRefreshToken({id: newUser._id})

  res.cookie('refreshtoken', refresh_token, {
    httpOnly: true,
    path: `/api/auth/refresh_token`,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30days
  })

  res.json({
    msg: 'Login Success!',
    access_token,
    user: {...newUser._doc, password: ''}
  })
}

export default authCtrl;
