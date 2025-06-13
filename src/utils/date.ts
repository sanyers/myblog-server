export const setTime = (v: number) => new Date(v * 1000).toLocaleString()
export const getTime = () => parseInt((new Date().getTime() / 1000).toString())
export const getDateTime = () => new Date().toLocaleString()
export const getNowAdd = (n: number, type: string, time?: Date) => {
  const now = time || new Date()
  switch (type) {
    case 'minutes':
      now.setMinutes(now.getMinutes() + n)
      break
    case 'hours':
      now.setHours(now.getHours() + n)
      break
    case 'date':
      now.setDate(now.getDate() + n)
      break
    case 'month':
      now.setMonth(now.getMonth() + n)
      break
    case 'year':
      now.setFullYear(now.getFullYear() + n)
      break
    default:
      break
  }
  return now.getTime()
}

export const formatDuration = (seconds: number) => {
  if (seconds === 0) return ''

  const timeUnits = [
    { value: Math.floor(seconds / 86400), unit: '天' },
    { value: Math.floor((seconds % 86400) / 3600), unit: '小时' },
    { value: Math.floor((seconds % 3600) / 60), unit: '分钟' },
    { value: seconds % 60, unit: '秒' },
  ]

  const result = timeUnits
    .filter(item => item.value > 0)
    .map(item => `${item.value}${item.unit}`)
    .join('')

  return result || ''
}
