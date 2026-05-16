# gll-金融投资指挥中台 · 前端

基于 HTML 原型 1:1 还原的企业级 React 中后台，技术栈：React 18 + Vite + TypeScript + Ant Design + Zustand + React Router v6 + Less/CSS Modules + Axios。

## 快速开始

```bash
cd frontend
npm install
npm run dev        # 开发 http://localhost:5173
npm run build      # 生产构建
npm run preview    # 预览 dist
```

**Mock 登录**：任意用户名 + 任意密码。

## 项目结构

```
frontend/
├── src/
│   ├── api/              # Axios 封装 + 业务接口 + mock 数据
│   │   ├── request.ts    # 拦截器、Token、重试、缓存
│   │   ├── mock/data.ts  # ★ Mock 静态数据（对接后端时主要改 mock/ 与 modules/）
│   │   └── modules/      # 按模块划分的 API
│   ├── components/
│   │   ├── business/     # 业务组件（如 MarketIndexChart）
│   │   ├── common/       # 通用组件（上传、预览、SubTabs…）
│   │   └── layout/       # 布局（侧栏、顶栏、AppLayout）
│   ├── config/theme.ts   # ★ Ant Design 主题色
│   ├── hooks/            # useDebounce、useThrottle、图表 hooks
│   ├── pages/            # ★ 各面板页面（与原型 panel 一一对应）
│   ├── router/           # 路由 + AuthGuard + 懒加载
│   ├── store/            # Zustand 全局状态（登录、scope、查询缓存）
│   ├── styles/
│   │   ├── variables.less  # ★ 全局颜色/尺寸变量（禁止硬编码色值）
│   │   ├── prototype.less  # 从 HTML 原型提取的样式
│   │   └── global.less
│   ├── types/            # TS 类型定义
│   └── utils/constants.ts # ★ 分页、超时、Token key 等常量
├── .env.development      # 开发环境变量
├── .env.production       # 生产环境变量
└── vercel.json           # SPA history 回退（防刷新 404）
```

## 环境与对接后端

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | API 根路径 |
| `VITE_USE_MOCK` | `true` 使用 mock，`false` 走真实接口 |

生产对接：将 `src/api/modules/*.ts` 中 `VITE_USE_MOCK` 分支保留，实现 `httpGet/httpPost` 调用即可；**不要**在页面里写死 mock。

## 路由

| 路径 | 页面 |
|------|------|
| `/login` | 登录 |
| `/app/dashboard` | 投资结论 / 市场总览 |
| `/app/alerts` | 异常提醒 |
| `/app/ai-insights` | 深度分析 |
| `/app/market` | 行情数据 |
| `/app/fundamental` | 基本面 |
| `/app/macro` | 宏观 |
| `/app/news` | 资讯 |
| `/app/portfolio-sim` | 收益模拟器 |
| `/app/settings` | 数据源百科 |

## 双态逻辑（全市场 / 个股）

- 顶栏搜索留空 → `scope-market`
- 输入并匹配标的（如 NVDA）→ `scope-symbol`
- 状态：`src/store/appStore.ts`
- 样式：`body.scope-market` / `body.scope-symbol` 控制 `.scope-market-only` / `.scope-symbol-only` 显隐

## Vercel 部署

### 方式 A：仓库根目录部署（推荐，已配置根目录 `vercel.json`）

直接连接 GitHub 仓库，**无需**改 Root Directory，推送后自动：

- 构建：`cd frontend && npm run build`
- 输出：`frontend/dist`
- SPA 路由回退：`index.html`

### 方式 B：仅部署 frontend 子目录

在 Vercel 项目 **Settings → General**：

| 配置项 | 值 |
|--------|-----|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Framework Preset | Vite |

### 访问地址

- 首页 / 登录：`https://你的域名.vercel.app/` 或 `/login`
- 中台（需先登录）：`https://你的域名.vercel.app/app/dashboard`

### 404 排查

1. **Vercel 自带 404 页**（黑底白字 NOT_FOUND）→ 构建产物路径不对，检查 Output 是否为 `frontend/dist` 或 Root 是否为 `frontend`
2. **能打开首页，刷新子路由 404** → 确认 `vercel.json` 中 `rewrites` 已生效并重新 Deploy
3. **构建失败** → Vercel → Deployments → 查看 Build Logs

```bash
npm run build
npm run preview   # 本地先验证 dist 是否正常
```

## 代码规范

```bash
npm run lint
npm run format
```

## 原型对照

HTML 原型位于仓库根目录：`prototype/investment-command-center.html`
