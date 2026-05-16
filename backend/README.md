# GLL 金融投资指挥中台 · 后端 API

Python **FastAPI** 服务：从 AkShare / yfinance / FRED 拉取行情、基本面、宏观、资讯与分析师预期，写入 SQLite（可换 PostgreSQL），向前端提供 REST JSON。

## 快速开始

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

- API 文档：http://127.0.0.1:8000/docs  
- 健康检查：http://127.0.0.1:8000/api/health  

**首次启动**会自动执行全量同步（`RUN_SYNC_ON_STARTUP=true`），约 3–10 分钟，视网络而定。

手动同步：

```bash
curl -X POST http://127.0.0.1:8000/api/sync/run-now
```

## 数据源与真实性说明

| 模块 | 真实性 | 来源 | 说明 |
|------|--------|------|------|
| A股日线 OHLCV | **真实** | AkShare | `stock_zh_a_hist`，同步入库 |
| 美股日线 OHLCV | **真实** | yfinance | `Ticker.history` |
| 指数曲线 | **真实** | AkShare + yfinance | SP500 / NASDAQ / CSI300 |
| 估值快照 PE/PB/ROE | **真实**（尽力） | yfinance / AkShare | 缺字段时显示「—」 |
| 分析师目标价/情景 | **真实**（美股） | yfinance | `targetMeanPrice` 等 |
| 资讯列表 | **真实**（尽力） | AkShare + yfinance | 同步后展示，失败则空 |
| 宏观 FRED | **真实** | FRED API | 需 `FRED_API_KEY` |
| VIX 等 | **真实** | FRED `VIXCLS` | 同上 |
| 投资结论/得分/异常 | **规则引擎** | `analyzer.py` | 非大模型 |
| 历史回顾（个股） | **真实**（有新闻时） | 该股已同步新闻标题 | 非 NVDA 硬编码 |
| Level2 / 期权链 | **未接入** | — | 返回空数据，`source: unavailable` |
| 宏观 LPR/社融/PMI 等 | **未接入** | — | 仅展示 FRED / 大宗商品同步结果 |
| 财报三表明细（美股） | **真实**（尽力） | yfinance 季报 | 失败时回退快照摘要 |
| 财报三表（A股） | **部分** | AkShare 摘要 | 完整三表待扩展 |
| 组合绩效曲线 | **真实**（有行情时） | 持仓权重 × 同步日线 | 无数据时为空 |
| 行业雷达 | **真实** | watchlist 涨跌 | 来自自选股同步 |
| 监控规则 | **配置** | `static_catalog.py` | 规则说明，非行情 |

### 是否使用 AI（大模型）？

**默认关闭**（`ENABLE_LLM=false`），此时为规则引擎，`insight_source=rules`。

开启步骤：

```bash
# 本机安装 Ollama 并拉模型
ollama pull qwen2.5:7b

# backend/.env
ENABLE_LLM=true
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
```

重启后端后，访问 `GET /api/symbol/NVDA/dashboard` 将先跑规则引擎，再调用 Ollama 覆盖 `summary`、人话解读、`ai_points` 等；成功时 `insight_source=llm`。Ollama 不可用则自动回退规则（`llm_status=unavailable`）。

### 财报三表（新增）

- **美股**：`GET /api/pages/fundamental/{symbol}` 尝试拉取 yfinance `quarterly_income_stmt` / `balance_sheet` / `cashflow`，并生成营收趋势图。
- **A股**：尝试 AkShare 财务摘要；完整三表可继续扩展。

## 主要 API（前缀 `/api`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/market/indices` | 指数卡片 |
| GET | `/market/watchlist` | 自选股雷达 |
| GET | `/market/index-series?period=3m` | 指数归一化曲线 |
| GET | `/market/alerts?scope=market\|symbol&symbol=NVDA` | 异常提醒 |
| GET | `/symbol/{code}/dashboard` | 个股投资结论+预测情景 |
| GET | `/symbol/{code}/quotes?period=3m` | K线数据 |
| GET | `/news?limit=40` | 资讯列表 |
| GET | `/macro/overview` | 宏观指标（旧） |
| GET | `/pages/market/{symbol}` | 行情页 OHLC/K线/Level2/期权 |
| GET | `/pages/fundamental/{symbol}` | 基本面页 |
| GET | `/pages/macro` | 宏观三 Tab |
| GET | `/pages/news` | 资讯舆情页 |
| GET | `/pages/insights` | 深度分析 |
| GET | `/pages/alerts` | 异常提醒聚合 |
| GET | `/pages/dashboard/market-extras` | 总览热力/建议 |
| GET | `/pages/settings` | 数据源百科 |
| GET | `/pages/portfolio` | 收益模拟器 |
| POST | `/sync/run-now` | 立即同步 |

响应格式（与前端一致）：

```json
{ "code": 0, "message": "ok", "success": true, "data": { } }
```

## 环境变量（`.env`）

```env
CORS_ORIGINS=http://localhost:5173,https://你的前端.vercel.app
WATCHLIST=NVDA,MSFT,AAPL,TSLA,600519
FRED_API_KEY=你的FRED密钥
DATABASE_URL=sqlite:///./data/finance.db
```

## 多标的切换（如何查看不同股票）

与 HTML 原型一致，平台支持 **全市场** 与 **个股** 两种视角：

1. **前端状态**（Zustand `appStore`）
   - `scope`: `market` | `symbol`
   - `currentSymbol`: 如 `NVDA`、`600519`
   - `setScopeSymbol(code, display)` / `setScopeMarket()`

2. **切换方式**
   - 顶栏输入代码/名称 → **回车或点「搜索」** → `GET /api/market/symbol/{code}` 解析名称
   - 顶栏快捷按钮、总览自选股行、异常页自选股列表
   - 清空搜索或点「×」→ 回到全市场

3. **页面如何带标的**
   - 个股结论/行情/基本面等：`currentSymbol` 传入 `/api/symbol/{code}/dashboard`、`/api/pages/market/{code}` 等
   - 资讯：`/api/pages/news?symbol=NVDA`（个股态筛选）
   - 全市场：不传 symbol，或 `scope=market`

4. **新标的首次查询**
   - `POST /api/sync/symbol/{code}` 后台同步该股行情与基本面（watchlist 外的代码也可查）

5. **样式**
   - `body.scope-market` / `body.scope-symbol` 控制侧栏角标、区块显隐（`ScopeVisible`）

## 对接前端

`frontend/.env.development`：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_USE_MOCK=false
```

Vercel 前端环境变量：

```env
VITE_API_BASE_URL=https://你的后端域名/api
VITE_USE_MOCK=false
```

## 部署建议

- **Railway / Render / Fly.io**：Root=`backend`，Start=`uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- 生产使用 **PostgreSQL**：`DATABASE_URL=postgresql+psycopg2://...`（需 `pip install psycopg2-binary`）
- 每日 18:30 自动同步（`SYNC_CRON_HOUR/MINUTE`）

## 目录结构

```
backend/
├── app/
│   ├── main.py           # FastAPI 入口 + 定时任务
│   ├── models.py         # SQLAlchemy 表
│   ├── services/
│   │   ├── data_clients.py   # AkShare/yfinance/FRED
│   │   ├── sync_service.py   # 入库
│   │   ├── market_service.py # 查询/聚合
│   │   └── analyzer.py       # 打分与建议
│   └── routers/          # REST 路由
├── data/finance.db       # SQLite（自动生成）
└── requirements.txt
```
