import express from 'express'
import { success } from '../res-code'
import { auth, authAdmin } from '../auth'
import os from 'os'
import { formatDuration } from '../utils/date'

const router = express.Router()

// 获取系统信息
router.get('/system', auth, async (req, res) => {
  const cpus = os.cpus()
  const uptimes = Math.floor(process.uptime())
  const uptime = formatDuration(uptimes)
  const data = {
    type: os.type(),
    arch: os.arch(),
    cpu: `${cpus[0].model} * ${cpus.length}`,
    hostname: os.hostname(),
    machine: os.machine(),
    uptime,
    rss: process.memoryUsage().rss,
  }
  success(res, data)
})

// 重启系统
router.post('/system/restart', authAdmin, async (req, res) => {
  success(res, 'ok')
  process.exit(0)
})

export default router
