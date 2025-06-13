import fs from 'fs'

export const tokenSave = () => {
  const list = [...tokenList.entries()]
  fs.writeFileSync('./data/token.json', JSON.stringify(list))
}

export const clearUserToken = (userName: string) => {
  const list = [...tokenList.values()]
  const deleteToken: Array<string> = []
  list.forEach(element => {
    if (element.userName === userName) {
      deleteToken.push(element.token)
    }
  })
  deleteToken.forEach(element => {
    tokenList.delete(element)
  })
  tokenSave()
}

export const tokenInit = () => {
  try {
    const str = fs.readFileSync('./data/token.json').toString()
    const list = JSON.parse(str)
    global.tokenList = new Map(list)
  } catch (e) {
    try {
      fs.mkdirSync('data')
    } catch (e) {}
    global.tokenList = new Map()
  }

  try {
    fs.mkdirSync('temp')
  } catch (e) {}
}
