#!/bin/bash
# Plugin Store 启动脚本
cd /root/plugin-store/backend
export NODE_ENV=production
export PORT=3005
node server.js
