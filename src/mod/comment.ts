import express from 'express'
import { success, error } from '../res-code'
import { Database } from '../db'
import { auth } from '../auth'
import { updateComment } from '../utils/comment-utils'

const router = express.Router()
const db = new Database()
const tableName = 'comments'
const blogTable = 'blog'

// 查询博客评论
router.get('/comment', async (req, res) => {
  const blogId = req.query.blogId
  const item = await db.find({ blogId }, tableName)
  if (item) {
    const list = item.comments.filter((i: any) => i.isShow)
    success(res, list)
  } else {
    success(res, [])
  }
})

// 查询博客评论（后台）
router.get('/comments', auth, async (req, res) => {
  const pageNum = Number((req.query.pageNum as string) || '1')
  const pageSize = Number((req.query.pageSize as string) || '10')
  const userName = req.headers['_userName'] as string

  const start = (pageNum - 1) * pageSize
  const sort = { _id: -1, utime: -1 }
  const where = { author: userName }

  const list = await db.findLimit(where, tableName, sort, start, pageSize)
  const ids = list.map(i => db.getObjectId(i.blogId))
  const blogList = await db.findAll({ _id: { $in: ids } }, blogTable)
  list.forEach(element => {
    const item = blogList.find(i => i._id.equals(element.blogId))
    if (item) {
      element.blogName = item.name
    }
  })
  const itemCount = await db.findCount(where, tableName)
  const pageCount = Math.ceil(itemCount / pageSize)
  const data = {
    list,
    itemCount,
    pageCount,
  }
  success(res, data)
})

// 博客评论（前台评论）
router.post('/comment', async (req, res) => {
  const blogId = req.body.blogId as string
  const desc = req.body.desc as string
  const userName = req.body.userName as string
  const email = req.body.email as string
  const quoteId = req.body.quoteId as number // 引用楼层

  if (!userName) {
    return error(res, 'userName is null')
  }

  await updateComment(
    desc,
    userName,
    db,
    blogId,
    blogTable,
    tableName,
    email,
    quoteId,
  )
  success(res, 'ok')
})

// 博客评论（后台回复）
router.post('/comments', auth, async (req, res) => {
  const blogId = req.body.blogId
  const desc = req.body.desc
  const email = req.body.email
  const quoteId = req.body.quoteId // 引用楼层
  const userName = req.headers['_userName'] as string

  await updateComment(
    desc,
    userName,
    db,
    blogId,
    blogTable,
    tableName,
    email,
    quoteId,
  )
  success(res, 'ok')
})

// 显示与隐藏评论（后台操作）
router.post('/comment/show', auth, async (req, res) => {
  const blogId = req.body.blogId
  const commentId = req.body.commentId
  const isShow = req.body.isShow
  const userName = req.headers['_userName']

  const blogItem = await db.find({ _id: db.getObjectId(blogId) }, blogTable)
  if (blogItem) {
    if (blogItem.author === userName) {
      await db.update(
        { blogId, 'comments.id': commentId },
        { 'comments.$.isShow': isShow },
        tableName,
      )
    }
  }

  success(res, 'ok')
})

// 删除评论（后台操作）
router.post('/comment/delete', auth, async (req, res) => {
  const blogId = req.body.blogId as string
  const commentId = req.body.commentId as number
  const userName = req.headers['_userName']

  const blogItem = await db.find({ _id: db.getObjectId(blogId) }, blogTable)
  if (blogItem) {
    if (blogItem.author === userName) {
      if (commentId) {
        await db.updates(
          { blogId },
          { $pull: { comments: { id: commentId } } },
          tableName,
        )
      } else {
        await db.delete({ blogId }, tableName)
      }
    }
  }

  success(res, 'ok')
})

export default router
