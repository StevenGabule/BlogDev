import express from 'express'
import categoryCtrl from '../controllers/category.controller'
import auth from '../middleware/auth'

const router = express.Router()

router.route('/')
  .get(categoryCtrl.getCategories)
  .post(auth, categoryCtrl.createCategory)

router.route('/:id')
  .patch(auth, categoryCtrl.updateCategory)
  .delete(auth, categoryCtrl.deleteCategory)

export {router as categoryRouter};
