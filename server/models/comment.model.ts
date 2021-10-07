import {model, Types, Schema} from 'mongoose'
import { IComment } from '../config/interface'

const commentSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User' },
  blog_id: Types.ObjectId,
  blog_user_id: Types.ObjectId,
  content: { type: String, required: true },
  replyCM: [{ type: Types.ObjectId, ref: 'comment' }],
  reply_user: { type: Types.ObjectId, ref: 'User' },
  comment_root: { type: Types.ObjectId, ref: 'comment' }
}, {
  timestamps: true
})

export default model<IComment>('comment', commentSchema)
