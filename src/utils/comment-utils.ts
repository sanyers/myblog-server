import { Database } from '../db'

export const updateComment = async (
  desc: string,
  userName: string,
  db: Database,
  blogId: string,
  blogTable: string,
  tableName: string,
  email: string,
  quoteId: number,
) => {
  const item = await db.find({ blogId }, tableName)
  const nowTime = new Date().getTime()
  const commentItem = {
    id: 1,
    desc,
    ctime: nowTime,
    userName,
    isShow: true,
    isAuthor: false,
    email: '',
    quoteId: 0,
  }

  if (email) {
    commentItem.email = email
  }

  if (item) {
    commentItem.isAuthor = item.author === userName
    if (quoteId) {
      commentItem.quoteId = quoteId
    }
    commentItem.id =
      item.comments.length > 0
        ? item.comments[item.comments.length - 1].id + 1
        : 1
    await db.updates(
      { blogId },
      { $push: { comments: commentItem } },
      tableName,
    )
    await db.update({ blogId }, { utime: new Date().getTime() }, tableName)
  } else {
    const blogItem = await db.find({ _id: db.getObjectId(blogId) }, blogTable)
    if (blogItem) {
      commentItem.isAuthor = blogItem.author === userName
      const utime = new Date().getTime()
      const data = {
        blogId,
        comments: [commentItem],
        author: blogItem.author,
        ctime: utime,
        utime,
      }
      await db.insert(data, tableName)
    }
  }
}
