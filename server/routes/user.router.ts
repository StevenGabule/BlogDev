import express from 'express'
import auth from '../middleware/auth'
import userCtrl from '../controllers/user.controller'

const router = express.Router()

router.patch('/', auth, userCtrl.updateUser)
router.patch('/reset_password', auth, userCtrl.resetPassword)
router.get('/:id', userCtrl.getUser)

export {router as userRouter};
