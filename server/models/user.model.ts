import {Schema, model} from 'mongoose'
import {IUser} from "../config/interface";

const userSchema = new Schema({
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [20, "Your name is up to 20 chars long."]
    },
    account: {
      type: String,
      required: [true, "Please add your email or phone"],
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Please add your password"],
    },
    avatar: {
      type: String,
      default: 'https://www.computerhope.com/jargon/g/guest-user.jpg',
    },
    type: {
      type: String,
      default: 'register'
    },
    role: {
      type: String,
      default: 'user'
    }
  },
  {
    versionKey: false,
    timestamps: true
  })
export default model<IUser>('User', userSchema)
