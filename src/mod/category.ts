import express from 'express'
import { success, error } from '../res-code'
import { Database } from '../db'
import { authAdmin } from '../auth'

const router = express.Router()
const db = new Database()
const categoryTable = 'category_'
const blogTable = 'blog'

// 获取类别
router.get('/category', async (req, res) => {
  const list: Array<any> = await db.findAll({}, `${categoryTable}1`)
  const typeList = await db.findAll({}, `${categoryTable}2`)
  list.forEach(element => {
    element.typeList = typeList.filter(i =>
      db.getObjectId(element._id).equals(i.parentId),
    )
  })
  success(res, list)
})

// 创建类别
router.post('/category', authAdmin, async (req, res) => {
  const parentId = req.body.parentId as string
  const type = req.body.type as number
  const name = req.body.name as string
  const desc = req.body.desc as string
  const tableName = `${categoryTable}${type}`
  const nowTime = new Date().getTime()
  const data: any = {
    name,
    ctime: nowTime,
    utime: nowTime,
    desc,
  }
  if (type === 2) {
    data.parentId = parentId
  }
  await db.insert(data, tableName)
  success(res, 'ok')
})

// 更新类别
router.post('/category/update', authAdmin, async (req, res) => {
  const id = req.body.id as string
  const type = req.body.type as number
  const name = req.body.name as string
  const desc = req.body.desc as string
  const tableName = `${categoryTable}${type}`
  const utime = new Date().getTime()
  const where = { _id: db.getObjectId(id) }
  const item = await db.find(where, tableName)
  if (item) {
    await db.update(where, { name, desc, utime }, tableName)
    success(res, 'ok')
  } else {
    error(res, 'id is not find')
  }
})

// 删除类别
router.post('/category/delete', authAdmin, async (req, res) => {
  const id = req.body.id as string
  const type = req.body.type as number
  const tableName = `${categoryTable}${type}`
  const where = { _id: db.getObjectId(id) }

  // 将所属博客类型置空
  if (type === 1) {
    await db.updateMany({ type1: id }, { type1: '', type2: '' }, blogTable)
  } else if (type === 2) {
    const item = await db.find(where, tableName)
    if (item) {
      await db.updateMany(
        { type1: item.parentId, type2: id },
        { type1: '', type2: '' },
        blogTable,
      )
    }
  }

  await db.delete(where, tableName)
  success(res, 'ok')
})

export default router
