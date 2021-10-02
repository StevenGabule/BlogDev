import {NextFunction, Request, Response} from "express";

export const validRegister = async (req: Request, res: Response, next: NextFunction) => {
  const {name, account, password} = req.body;
  const errors = [];

  if (!name) {
    errors.push('Please add your name.')
  } else if (name.length > 20) {
    errors.push('Your name is up to 20 chars long.')
  }

  if (!account) {
    errors.push('Please add your email or phone number.')
  } else if (!validEmail(account) && !validPhone(account)) {
    errors.push('Email or phone is invalid')
  }

  if (!password) {
    errors.push('Please add your password.')
  }

  if (password.length < 6) {
    errors.push('Your password must be at least 6 char long.')
  }
  
  console.log(errors)
  if (errors.length > 0) return res.status(400).json({msg: errors})

   next()
}

export function validEmail(email: string): boolean {
  return /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/.test(email);
}

export function validPhone(phone: string): boolean {
  return /^[+]/g.test(phone);
}
