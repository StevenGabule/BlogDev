import dotenv from 'dotenv'

dotenv.config()

import mongoose from 'mongoose'

const URI: string = process.env.MONGODB_URL || "";

(async () => {
  try {
    const db = await mongoose.connect(`${URI}`, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    console.log(`Database connect successfully: ${db.connection.name}`)
  } catch (e: any) {
    console.log(e.message)
  }
})()
