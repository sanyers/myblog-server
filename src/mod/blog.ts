import express from 'express'
import multipart from 'connect-multiparty'
import { success, error } from '../res-code'
import { Database } from '../db'
import { auth } from '../auth'
import fs from 'fs'
import { v4 } from 'uuid'

const router = express.Router()
const mp = multipart({ uploadDir: './temp' })
const db = new Database()
const tableName = 'blog'
const commentTableName = 'comments'

// 根据ID获取博客
router.get('/blog', async (req, res) => {
  const id = req.query.id as string
  const where = { _id: db.getObjectId(id), release: true }
  const item = await db.find(where, tableName)
  if (item) {
    success(res, item)
  } else {
    error(res, 'id is not find')
  }
})

// 根据ID获取博客（后台）
router.get('/blogs', auth, async (req, res) => {
  const id = req.query.id as string
  const userName = req.headers['_userName'] as string
  const where = { _id: db.getObjectId(id), author: userName }
  const item = await db.find(where, tableName)
  if (item) {
    success(res, item)
  } else {
    error(res, 'id is not find')
  }
})

// 搜索博客
router.get('/blog/search', async (req, res) => {
  const name = req.query.name as string
  const pageNum = Number((req.query.pageNum as string) || '1')
  const pageSize = Number((req.query.pageSize as string) || '10')
  const start = (pageNum - 1) * pageSize
  const where = {
    release: true,
    $or: [
      { name: { $regex: name } },
      { content: { $regex: name } },
      { desc: { $regex: name } },
    ],
  }
  const sort = { _id: -1, utime: -1 }
  const list = await db.findLimit(where, tableName, sort, start, pageSize)
  const itemCount = await db.findCount(where, tableName)
  const pageCount = Math.ceil(itemCount / pageSize)
  const data = {
    list,
    itemCount,
    pageCount,
  }
  success(res, data)
})

// 按类别查询博客列表
router.get('/blog/list', async (req, res) => {
  const type1 = req.query.type1 as string
  const type2 = req.query.type2 as string
  const pageNum = Number((req.query.pageNum as string) || '1')
  const pageSize = Number((req.query.pageSize as string) || '10')
  const start = (pageNum - 1) * pageSize
  const where = { type1, type2, release: true }
  const sort = { _id: 1, ctime: 1 }
  const list = await db.findLimit(where, tableName, sort, start, pageSize)
  const itemCount = await db.findCount(where, tableName)
  const pageCount = Math.ceil(itemCount / pageSize)
  const data = {
    list,
    itemCount,
    pageCount,
  }
  success(res, data)
})

// 按类别查询博客列表（后台操作）
router.get('/blog/lists', auth, async (req, res) => {
  const type1 = (req.query.type1 as string) || ''
  const type2 = (req.query.type2 as string) || ''
  const isTop = (req.query.isTop as string) || ''
  const release = (req.query.release as string) || ''
  const pageNum = Number((req.query.pageNum as string) || '1')
  const pageSize = Number((req.query.pageSize as string) || '10')
  const userName = req.headers['_userName'] as string

  const start = (pageNum - 1) * pageSize
  const where: any = { author: userName }
  if (type1) {
    where.type1 = type1
  }
  if (type2) {
    where.type2 = type2
  }
  if (isTop) {
    where.isTop = isTop === 'true' ? true : false
  }
  if (release) {
    where.release = release === 'true' ? true : false
  }
  const sort = { _id: -1, ctime: -1 }
  const list = await db.findLimit(where, tableName, sort, start, pageSize)
  const itemCount = await db.findCount(where, tableName)
  const pageCount = Math.ceil(itemCount / pageSize)
  const data = {
    list,
    itemCount,
    pageCount,
  }
  success(res, data)
})

// 最近更新列表
router.get('/blog/last', async (req, res) => {
  const sort = { ctime: -1 }
  const where = { release: true }
  const list = await db.findLimit(where, tableName, sort, 0, 10)
  success(res, list)
})

// 创建、更新博客
router.post('/blog', auth, async (req, res) => {
  let id = req.body.id as string
  const type1 = req.body.type1 as string
  const type2 = req.body.type2 as string
  const name = req.body.name as string
  const desc = req.body.desc as string // 描述
  const content = req.body.content as string
  const format = (req.body.format as string) || 'md' // md or html
  const userName = req.headers['_userName']

  const nowTime = new Date().getTime()
  const data: any = {
    content,
    utime: nowTime,
    author: userName,
    authorLink: '',
  }
  if (type1) {
    data.type1 = type1
    data.type2 = type2
  }
  if (name) {
    data.name = name
  }

  if (desc) {
    data.desc = desc
  }
  if (id) {
    await db.update({ _id: db.getObjectId(id) }, data, tableName)
  } else {
    data.isTop = false
    data.ctime = nowTime
    data.release = false
    data.format = format
    const d = await db.insert(data, tableName)
    id = d.insertedId.toString()
  }
  success(res, id)
})

// 修改博客创建时间
router.post('/blog/time', auth, async (req, res) => {
  let id = req.body.id as string
  const time = req.body.time as number
  const userName = req.headers['_userName']

  const where = { _id: db.getObjectId(id), author: userName }
  const item = await db.find(where, tableName)
  if (item) {
    const update = { ctime: time }
    await db.update(where, update, tableName)
    success(res, 'ok')
  } else {
    error(res, '未找到博客id')
  }
})

// 查询置顶博客
router.get('/blog/top', async (req, res) => {
  const where = { isTop: true, release: true }
  const list = await db.findAll(where, tableName)
  success(res, list)
})

// 置顶、取消置顶博客
router.post('/blog/top', auth, async (req, res) => {
  const id = req.body.id as string
  const isTop = req.body.isTop as string
  const userName = req.headers['_userName']
  await db.update(
    { _id: db.getObjectId(id), author: userName },
    { isTop },
    tableName,
  )
  success(res, 'ok')
})

// 删除博客
router.post('/blog/delete', auth, async (req, res) => {
  const id = req.body.id as string
  const type1 = req.body.type1 as string
  const type2 = req.body.type2 as string
  const userName = req.headers['_userName']

  if (id) {
    const where = { _id: db.getObjectId(id), author: userName }
    await db.delete(where, tableName)
    await db.delete({ blogId: id }, commentTableName)
  }
  if (type1 && type2) {
    const where = { type1, type2, author: userName }
    const list = await db.findAll(where, tableName)
    await db.deleteAll(where, tableName)
    const blogId = list.map(i => i._id)
    await db.deleteAll({ blogId: { $in: blogId } }, commentTableName)
  }
  success(res, 'ok')
})

// 发布与取消发布
router.post('/blog/release', auth, async (req, res) => {
  const id = req.body.id as string
  const release = req.body.release as boolean
  const userName = req.headers['_userName']
  await db.update(
    { _id: db.getObjectId(id), author: userName },
    { release },
    tableName,
  )
  success(res, 'ok')
})

// 上传博客图片
router.post('/blog/file', auth, mp, async (req, res) => {
  const type1 = req.body.type1 as string
  const type2 = req.body.type2 as string
  const { file } = req.files
  const newPath1 = `./web/${type1}`
  try {
    fs.mkdirSync(newPath1)
  } catch (e) {}
  const newPath2 = `${newPath1}/${type2}`
  try {
    fs.mkdirSync(newPath2)
  } catch (e) {}

  const list: Array<string> = []
  if (Array.isArray(file)) {
    file.forEach((item: any) => {
      const fileName = v4() + '.' + item.name.split('.')[1]
      const newPath = `${newPath2}/${fileName}`
      fs.renameSync(item.path, newPath)
      const url = `/imgs/${type1}/${type2}/${fileName}`
      list.push(url)
    })
  } else {
    const fileName = v4() + '.' + file.name.split('.')[1]
    const newPath = `${newPath2}/${fileName}`
    fs.renameSync(file.path, newPath)
    const url = `/imgs/${type1}/${type2}/${fileName}`
    list.push(url)
  }
  success(res, list)
})

// 设置博客类型
router.post('/blog/settype', auth, async (req, res) => {
  const id = req.body.id as string
  const type1 = (req.body.type1 as string) || ''
  const type2 = (req.body.type2 as string) || ''
  const userName = req.headers['_userName'] as string

  const where = { _id: db.getObjectId(id), author: userName }
  const update = { type1, type2 }
  await db.update(where, update, tableName)
  success(res, 'ok')
})

export default router
