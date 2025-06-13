import express from 'express'
import { success, error } from '../res-code'
import { Database } from '../db'
import { encrypt } from '../utils/crypto'
import { v4 } from 'uuid'
import { TokenItem } from '../types/token'
import { getNowAdd, getTime } from '../utils/date'
import { auth, authAdmin } from '../auth'
import { tokenSave, tokenInit, clearUserToken } from '../utils/user-utils'
import { checkName } from '../utils/string'

const router = express.Router()
const db = new Database()
const tableName = 'user'
tokenInit()

// 获取登录信息
router.get('/user/info', auth, async (req, res) => {
  const userName = req.headers['_userName'] as string
  const item = await db.find({ userName }, tableName)
  if (item) {
    delete item.userPwd
  }

  success(res, item)
})

// 初始化查询
router.get('/user/init', async (_, res) => {
  const list = await db.findAll({}, tableName)
  success(res, list.length > 0)
})

// 首次注册后台
router.post('/user/init', async (req, res) => {
  const list = await db.findAll({}, tableName)
  if (list.length) {
    res.statusCode = 404
    return error(res, 'request was aborted')
  }

  const userName = req.body.userName as string
  const userPwd = req.body.userPwd as string

  if (!userName) {
    return error(res, 'username is null')
  }
  if (!userPwd) {
    return error(res, 'password is null')
  }

  if (userName.length < 4 || userName.length > 20) {
    return error(res, '用户名长度至少为4个字符，不超过20个字符。')
  }

  if (userPwd.length < 6 || userPwd.length > 30) {
    return error(res, '密码长度至少为6个字符，不超过30个字符。')
  }

  if (!checkName(userName)) {
    return error(res, '用户名只能包含字母、数字、下划线和连字符')
  }

  const data = {
    userName,
    userPwd: encrypt(userPwd),
    role: 0,
    ctime: getTime(),
  }
  await db.insert(data, tableName)

  const token = v4()
  const datas: TokenItem = {
    userName,
    token,
    role: 0,
    lastTime: getNowAdd(1, 'month'),
  }
  tokenList.set(token, datas)
  tokenSave()
  success(res, datas)
})

// 添加后台用户（管理员）
router.post('/user/add', authAdmin, async (req, res) => {
  const userName = req.body.userName as string
  const userPwd = req.body.userPwd as string
  const role = req.body.role as number // 0 管理员，1 普通用户，-1 禁用

  const data = {
    userName,
    userPwd: encrypt(userPwd),
    role,
    ctime: getTime(),
  }
  const item = await db.find({ userName }, tableName)
  if (item) {
    error(res, '该用户名已存在')
  } else {
    await db.insert(data, tableName)
    success(res, 'ok')
  }
})

// 修改账号权限（管理员）
router.post('/user/role', authAdmin, async (req, res) => {
  const userName = req.body.userName as string
  const role = req.body.role as string
  const selfName = req.headers['_userName']

  if (selfName === userName) {
    return error(res, '不能修改自己的权限')
  }

  const update = { role }
  await db.update({ userName }, update, tableName)
  clearUserToken(userName)
  success(res, 'ok')
})

// 后台登录
router.post('/user/login', async (req, res) => {
  const userName = req.body.userName
  const userPwd = req.body.userPwd

  if (!userName || !userPwd) {
    error(res, 'userName or userPwd is null')
    return
  }

  const item = await db.find({ userName, userPwd: encrypt(userPwd) }, tableName)
  if (item) {
    const token = v4()
    const data: TokenItem = {
      userName,
      token,
      role: item.role,
      lastTime: getNowAdd(1, 'month'),
    }
    tokenList.set(token, data)
    tokenSave()
    success(res, data)
  } else {
    error(res, '登录失败，用户名或密码错误')
  }
})

// 退出系统
router.post('/user/logout', async (req, res) => {
  const token = req.headers.authorization
  if (token) {
    const item = tokenList.get(token)
    if (item) {
      tokenList.delete(token)
      tokenSave()
    }
  }
  success(res, 'ok')
})

// 重置当前账号密码
router.post('/user/resetpassword', auth, async (req, res) => {
  const oldPwd = req.body.oldPwd as string
  const newPwd = req.body.newPwd as string
  const userName = req.headers['_userName'] as string

  if (!oldPwd) {
    error(res, 'oldPwd is null')
    return
  }

  if (!newPwd) {
    error(res, 'newPwd is null')
    return
  }

  if (newPwd.length < 6 || newPwd.length > 30) {
    return error(res, '密码长度至少为6个字符，不超过30个字符。')
  }

  const item = await db.find({ userName, userPwd: encrypt(oldPwd) }, tableName)
  if (item) {
    const update = { userPwd: encrypt(newPwd) }
    await db.update({ userName }, update, tableName)
    clearUserToken(userName)
    success(res, 'ok')
  } else {
    error(res, '旧密码错误')
  }
})

// 重置账号密码（管理员）
router.post('/user/resetpasswords', authAdmin, async (req, res) => {
  const userName = req.body.userName as string
  const userPwd = req.body.userPwd as string
  const selfName = req.headers['_userName']

  if (selfName === userName) {
    return error(res, '不能修改自己的密码')
  }

  if (userPwd.length < 6 || userPwd.length > 30) {
    return error(res, '密码长度至少为6个字符，不超过30个字符。')
  }

  const update = { userPwd: encrypt(userPwd) }
  await db.update({ userName }, update, tableName)
  clearUserToken(userName)
  success(res, 'ok')
})

// 删除账号（管理员）
router.post('/user/delete', authAdmin, async (req, res) => {
  const userName = req.body.userName as string
  const selfName = req.headers['_userName']

  if (selfName === userName) {
    return error(res, '不能删除自己')
  }

  await db.delete({ userName }, tableName)
  clearUserToken(userName)
  success(res, 'ok')
})

// 获取用户列表（管理员）
router.get('/user/list', authAdmin, async (req, res) => {
  const userName = req.query.userName as string
  const isAdmin = (req.query.isAdmin as string) || 'false'
  const pageNum = Number((req.query.pageNum as string) || '1')
  const pageSize = Number((req.query.pageSize as string) || '10')

  const start = (pageNum - 1) * pageSize
  const where: any = {}
  if (userName) {
    where.userName = userName
  }
  if (isAdmin === 'true') {
    where.role = 0
  }
  const sort = { _id: -1, ctime: -1 }
  const list = await db.findLimit(where, tableName, sort, start, pageSize)
  list.forEach(element => {
    delete element.userPwd
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

export default router
