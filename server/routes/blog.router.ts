import express from 'express'
import blogCtrl from '../controllers/blog.controller'
import auth from '../middleware/auth'

const router = express.Router()


router.post('/', auth, blogCtrl.createBlog)
router.get('/home/posts', blogCtrl.getHomeBlogs)
router.get('/:category_id', blogCtrl.getBlogsByCategory)

export {router as blogRouter};
