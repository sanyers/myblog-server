import { MongoClient, Db, ObjectId } from 'mongodb'
import { mongodb_conf } from './env'
import { consoleTime } from './utils/console'

export class Database {
  private dbs: Db | null = null

  constructor(databaseName?: string | null, connect?: Function) {
    this.connect(databaseName || mongodb_conf.db || '', connect)
  }

  private async connect(databaseName: string, connect?: Function) {
    const { base, port, user, pwd } = mongodb_conf
    const pwden = encodeURIComponent(pwd as string)
    const url = `mongodb://${user}:${pwden}@${base}:${port}/`
    const client: MongoClient = new MongoClient(url)

    try {
      await client.connect()
      this.dbs = client.db(databaseName)
      connect && connect()
    } catch (e: any) {
      consoleTime.error(e.toString())
    }
  }

  getObjectId(id: string) {
    return new ObjectId(id)
  }

  // 插入一条数据
  insert(data: any, tabName: string) {
    return this.dbs
      ? this.dbs.collection(tabName).insertOne(data)
      : Promise.reject(null)
  }

  // 更新一条数据
  update(where: any, update: any, tabName: string) {
    update = { $set: update }
    return this.dbs
      ? this.dbs.collection(tabName).updateOne(where, update)
      : Promise.reject(null)
  }

  // 更新数据
  updates(where: any, update: any, tabName: string) {
    return this.dbs
      ? this.dbs.collection(tabName).updateOne(where, update)
      : Promise.reject(null)
  }

  // 更新多条数据
  updateMany(where: any, update: any, tabName: string) {
    update = { $set: update }
    return this.dbs
      ? this.dbs.collection(tabName).updateMany(where, update)
      : Promise.reject(null)
  }

  findAll(where: any, tabName: string) {
    return this.dbs
      ? this.dbs.collection(tabName).find(where).toArray()
      : Promise.reject(null)
  }

  find(where: any, tabName: string) {
    return this.dbs
      ? this.dbs.collection(tabName).findOne(where)
      : Promise.reject(null)
  }

  findLimit(
    where: any,
    tabName: string,
    sort: any,
    start: number,
    end: number,
  ) {
    return this.dbs
      ? this.dbs
          .collection(tabName)
          .find(where)
          .sort(sort)
          .skip(start)
          .limit(end)
          .toArray()
      : Promise.reject(null)
  }

  findCount(where: any, tabName: string) {
    return this.dbs
      ? this.dbs.collection(tabName).countDocuments(where)
      : Promise.reject(null)
  }

  delete(where: any, tabName: string) {
    return this.dbs
      ? this.dbs.collection(tabName).deleteOne(where)
      : Promise.reject(null)
  }
  deleteAll(where: any, tabName: string) {
    return this.dbs
      ? this.dbs.collection(tabName).deleteMany(where)
      : Promise.reject(null)
  }
  deleteTable(tabName: string) {
    return this.dbs ? this.dbs.dropCollection(tabName) : Promise.reject(null)
  }
}
