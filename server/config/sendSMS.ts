import dotenv from 'dotenv'

dotenv.config()

import {Twilio} from 'twilio'

const accountSid = `${process.env.TWILIO_ACCOUNT_SID}`;
const authToken = `${process.env.TWILIO_AUTH_TOKEN}`;
const from = `${process.env.TWILIO_PHONE_NUMBER}`
const serviceID = `${process.env.TWILIO_SERVICE_ID}`;
const client = new Twilio(accountSid, authToken);

export const sendSms = async (to: string, body: string, txt: string) => {
  try {
    await client.messages.create({body: `BlogDev ${txt} - ${body}`, from, to,})
  } catch (err) {
    console.log(err)
  }
}

export const smsOTP = async (to: string, channel: string) => {
  try {
    return await client.verify.services(serviceID).verifications.create({to, channel})
  } catch (err) {
    console.log("smsOTP: ",err)
  }
}

export const smsVerify = async (to: string, code: string) => {
  try {
    return await client.verify.services(serviceID).verificationChecks.create({to, code})
  } catch (err) {
    console.log("smsVerify: ", err)
  }
}
