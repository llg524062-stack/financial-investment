# financial-investment

金融投资指挥中台 monorepo。

| 目录 | 说明 |
|------|------|
| `prototype/` | HTML 交互原型 |
| `frontend/` | React 前端（Vercel） |
| `backend/` | **Python FastAPI 后端**（AkShare / yfinance / FRED） |

## 本地联调

**终端 1 — 后端**

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
python run.py
# 首次启动会自动同步数据；或 curl -X POST http://127.0.0.1:8000/api/sync/run-now
```

**终端 2 — 前端**

```bash
cd frontend && npm install && npm run dev
```

打开 http://localhost:5173（已配置 `VITE_USE_MOCK=false` 对接本地 API）

## 部署

- [DEPLOY.md](./DEPLOY.md) — Docker Compose、Railway 后端、Vercel 前端环境变量

## 文档

- [frontend/README.md](./frontend/README.md)
- [backend/README.md](./backend/README.md)
