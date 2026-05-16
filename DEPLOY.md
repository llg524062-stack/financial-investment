# 部署指南

## 架构

| 组件 | 推荐平台 | 说明 |
|------|----------|------|
| 前端 `frontend/` | Vercel | 静态 SPA，`vercel.json` 已配置 |
| 后端 `backend/` | Railway / Docker | FastAPI + 定时同步 |
| 数据库 | Railway PostgreSQL 或 SQLite 卷 | 生产建议 PostgreSQL |

## 一、Docker Compose（本地 / 单机服务器）

```bash
# 根目录
cp backend/.env.example backend/.env
# 可选：填写 FRED_API_KEY

docker compose up --build
```

- 前端开发：`cd frontend && npm i && npm run dev`（代理 `/api` → `localhost:8000`）
- 后端 API：http://localhost:8000/docs
- 首次启动会执行 `RUN_SYNC_ON_STARTUP=true` 拉取行情（约数分钟）

## 二、Railway 一键部署后端

### 常见构建失败：`Failed to build an image`（约 7 秒失败）

| 原因 | 处理 |
|------|------|
| **Root Directory 未设置** | 在 Railway 服务 **Settings → Root Directory** 填 `backend`，或留空使用仓库根目录 `Dockerfile` |
| 部署了整个 monorepo 但无根 Dockerfile | 已提供根目录 `Dockerfile` + `railway.toml`，可直接从仓库根部署 |
| `akshare` 编译依赖缺失 | `backend/Dockerfile` 已增加 `libxml2`、`g++` 等系统库 |
| 健康检查在首次同步前超时 | 默认 `RUN_SYNC_ON_STARTUP=false`，部署成功后再在 Variables 改为 `true` |

构建成功后：服务 **Settings → Networking → Generate Domain** 生成公网域名。

1. 在 [Railway](https://railway.app) 新建项目 → **Deploy from GitHub** 选择本仓库
2. 服务设置（二选一）：
   - **推荐**：**Root Directory** = `backend`（使用 `backend/Dockerfile`）
   - **或**：Root Directory 留空（使用仓库根目录 `Dockerfile`，会自动 `COPY backend/`）
3. 添加 **PostgreSQL** 插件，Railway 会自动注入 `DATABASE_URL`
4. 环境变量（Variables）：

| 变量 | 示例 |
|------|------|
| `CORS_ORIGINS` | `https://financial-investment-one.vercel.app,http://localhost:5173` |
| `WATCHLIST` | `NVDA,MSFT,AAPL,TSLA,600519` |
| `RUN_SYNC_ON_STARTUP` | `true` |
| `FRED_API_KEY` | （可选）宏观数据 |
| `SYNC_CRON_HOUR` | `6` |

5. 部署完成后复制公网 URL，例如 `https://xxx.up.railway.app`
6. 健康检查：`GET https://xxx.up.railway.app/api/health`
7. 手动同步：`POST https://xxx.up.railway.app/api/sync/run-now`

## 三、Vercel 部署前端并联调

**生产站点**：https://financial-investment-one.vercel.app

1. 导入 GitHub 仓库，**Root Directory** 设为 `frontend`（或使用根目录 `vercel.json` 指向 `frontend/dist`）
2. Build：`npm run build`，Output：`dist`
3. **必配**环境变量（Settings → Environment Variables → Production）：

```
VITE_API_BASE_URL=https://你的Railway服务.up.railway.app/api
```

> 不要用 `/api` 相对路径，除非你在 Vercel 额外配置了反代。当前仓库已移除 Mock，未配置此项时页面可能仍显示旧版静态数据或接口失败。

4. 保存后 **Redeploy**（重新部署才会注入 `VITE_*` 变量）
5. 访问 https://financial-investment-one.vercel.app/app/dashboard
6. 浏览器开发者工具 → Network：请求应指向 `https://xxx.up.railway.app/api/...`，不应出现 Mock 字样

## 四、仅 SQLite（无 Postgres）

`docker-compose.yml` 可注释 `db` 服务，后端使用默认 `sqlite:///./data/finance.db`（需挂载 `backend/data` 卷）。

## 五、启用 Ollama 人话研判（可选）

1. 部署环境安装 [Ollama](https://ollama.com) 或使用同网段 Ollama 服务
2. Railway 环境变量增加：
   ```
   ENABLE_LLM=true
   OLLAMA_BASE_URL=http://你的Ollama主机:11434
   OLLAMA_MODEL=qwen2.5:7b
   ```
3. 健康检查 `GET /api/health` 应返回 `"llm_enabled": true`

## 六、常见问题

- **前端空白 / 接口 404**：检查 `VITE_API_BASE_URL` 是否以 `/api` 结尾
- **CORS 错误**：后端 `CORS_ORIGINS` 必须包含 Vercel 域名（无尾斜杠）
- **无行情数据**：调用 `POST /api/sync/run-now`，查看 Railway 日志中 AkShare/yfinance 报错
- **Railway 端口**：平台注入 `PORT`，`railway.toml` 的 `startCommand` 已使用 `$PORT`
