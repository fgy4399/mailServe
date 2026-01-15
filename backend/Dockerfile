# 后端 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src ./src

# 暴露端口
EXPOSE 3000 2525 3001

# 启动命令
CMD ["node", "src/index.js"]
