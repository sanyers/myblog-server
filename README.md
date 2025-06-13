# 我的博客

基于 Node.js + TypeScript + Express 快速搭建轻量级博客系统后台

预览：[https://blog.sanyer.top/](https://blog.sanyer.top/)

前端项目：[myblog-web](https://github.com/sanyers/myblog-web)

依赖：

- Node.js v16.20.0
- mongodb v6.0

功能：

- [x] 用户管理（登录、注册、多用户）
- [x] 类别管理（博客分类，二级分类）
- [x] 博客管理（博客列表、全文搜索、最近更新、置顶博客、发布与取消博客、上传图片、上传视频）
- [x] 评论管理（博客评论列表、删除评论、审核评论）
- [x] 支持 Markdown 和 HTML 格式

## 1、安装

```bash
npm install
```

## 2、配置

```
cp example.env .env
vim .env
```

## 3、运行

```bash
npm run dev
```

## 4、部署

```bash
npm run build

pm2 start ./dist/app.js
```