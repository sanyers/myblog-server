import dotenv from 'dotenv'
dotenv.config()

export const server_port = process.env.server_port
export const api_prefix = process.env.api_prefix
export const mongodb_conf = {
  base: process.env.mongodb_base,
  port: process.env.mongodb_port,
  user: process.env.mongodb_user,
  pwd: process.env.mongodb_pwd,
  db: process.env.mongodb_db,
}
