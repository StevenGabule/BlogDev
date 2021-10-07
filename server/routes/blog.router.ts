import express from 'express'
import blogCtrl from '../controllers/blog.controller'
import auth from '../middleware/auth'

const router = express.Router()

router.post('/blogs', auth, blogCtrl.createBlog)
router.get('/blogs/home/posts', blogCtrl.getHomeBlogs)
router.get('/blogs/category/:id', blogCtrl.getBlogsByCategory)
router.get('/blogs/user/:id', blogCtrl.getBlogsByUser)
router.route('/blog/:id')
  .get(blogCtrl.getBlog)
  .put(auth, blogCtrl.updateBlog)
  .delete(auth, blogCtrl.deleteBlog)
export {router as blogRouter};
