import {Schema, model, Types} from 'mongoose'
import { IBlog } from '../config/interface'

const blogSchema = new Schema({
  user: {type: Types.ObjectId, ref: 'User'},
  title: {
    type: String,
    require: true,
    trim: true,
    minLength: 10,
    maxLength: 50
  },
  content: {
    type: String,
    require: true,
    minLength: 2000
  },
  description: {
    type: String,
    require: true,
    trim: true,
    minLength: 50,
    maxLength: 200
  },
  thumbnail: {
    type: String,
    require: true
  },
  category: {type: Types.ObjectId, ref: 'category'}
}, {
  timestamps: true
})

export default model<IBlog>('blog', blogSchema)
