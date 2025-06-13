import { Request, Response } from 'express'
import { error } from './res-code'
import { tokenSave } from './utils/user-utils'

/**
 * 验证管理员登录及过期
 */
export const authAdmin = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization as string
  const item = tokenList.get(token)
  if (item) {
    const nowTime = new Date().getTime()
    if (item.lastTime > nowTime) {
      if (item.role === 0) {
        req.headers['_userName'] = item.userName
        next()
      } else {
        res.status(401)
        error(res, '权限不足')
      }
    } else {
      tokenList.delete(token)
      tokenSave()
      res.status(401)
      error(res, '登录已过期')
    }
  } else {
    res.status(401)
    error(res, '权限认证失败')
  }
}

/**
 * 验证普通用户登录及过期
 */
export const auth = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization as string
  const item = tokenList.get(token)
  if (item) {
    const nowTime = new Date().getTime()
    if (item.lastTime > nowTime) {
      if (item.role >= 0) {
        req.headers['_userName'] = item.userName
        next()
      } else {
        res.status(401)
        error(res, '该用户已禁用')
      }
    } else {
      tokenList.delete(token)
      tokenSave()
      res.status(401)
      error(res, '登录已过期')
    }
  } else {
    res.status(401)
    error(res, '权限认证失败')
  }
}
