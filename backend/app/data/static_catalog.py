"""Static prototype-aligned content (industry radar, rules, data source encyclopedia)."""

INDUSTRY_HEATMAP = [
    {"name": "半导体", "change": 2.1, "level": 3},
    {"name": "AI软件", "change": 1.5, "level": 2},
    {"name": "电力", "change": 0.8, "level": 1},
    {"name": "消费", "change": 0.0, "level": 0},
    {"name": "医药", "change": -0.6, "level": -1},
    {"name": "地产", "change": -1.8, "level": -2},
    {"name": "银行", "change": -0.5, "level": -1},
    {"name": "能源", "change": 0.4, "level": 1},
]

SECTOR_RADAR = [
    {"sector": "AI 算力", "heat": "高", "view": "Capex 周期延续，优选龙头", "symbols": "NVDA, AVGO"},
    {"sector": "电力设备", "heat": "中高", "view": "数据中心用电需求爆发", "symbols": "VRT, ETN"},
    {"sector": "消费零售", "heat": "中", "view": "分化严重，等待 CPI 回落信号", "symbols": "COST, WMT"},
    {"sector": "地产链", "heat": "低", "view": "政策底未确认，观望", "symbols": "—"},
]

MONITOR_RULES = [
    {"name": "短期暴涨", "explain": "涨太猛，容易回调", "condition": "30 日涨幅 > 15%", "status": "已触发"},
    {"name": "估值过高", "explain": "股价偏贵", "condition": "PE > 行业中位 ×1.5", "status": "已触发"},
    {"name": "市场恐慌", "explain": "整体风险偏好下降", "condition": "VIX 周涨 > 5%", "status": "已触发"},
    {"name": "财报窗口", "explain": "财报前后波动大", "condition": "财报日前后 3 天", "status": "已过期"},
    {"name": "大股东减持", "explain": "内部人卖股票", "condition": "减持公告", "status": "监控中"},
]

MARKET_ADVICE = {
    "position": "建议股票仓位 55%，保留 45% 现金/债券应对波动。",
    "direction": "超配 AI 算力、电力设备；标配消费龙头；低配地产链。",
    "action": "不追涨，等回调或财报后再加仓；单只股票不超过总资产 20%。",
}

HISTORY_EVENTS = [
    {"period": "2025 Q1", "event": "Blackwell 架构发布，数据中心营收 +94%", "reaction": "+45%", "lesson": "业绩驱动的主升浪，验证 AI 算力逻辑"},
    {"period": "2024 Q3", "event": "财报不及预期、毛利率指引下调", "reaction": "-12%", "lesson": "高估值下对指引极其敏感，宜等待消化"},
    {"period": "2024 Q1", "event": "ChatGPT 带动的 AI 基建潮起步", "reaction": "+82%", "lesson": "产业趋势初期，龙头享受估值+业绩双升"},
    {"period": "2022", "event": "加密货币挖矿退潮、库存计提", "reaction": "-51%", "lesson": "周期底部区域，长期布局价值凸显"},
]

DATA_SOURCE_CATEGORIES = [
    {
        "id": "quote",
        "title": "① 行情与交易数据",
        "subtitle": "回答：现在多少钱？涨了多少？",
        "rows": [
            ["实时报价", "当前价格、涨跌幅", "AkShare / yfinance", "免费", "ak.stock_zh_a_hist / yf.Ticker"],
            ["K线 OHLCV", "开高低收量", "BaoStock / yfinance", "免费", "日/周/月周期"],
            ["Level2/期权", "买卖盘、期权链", "券商 / yfinance", "付费/免费", "期权链 option_chain"],
        ],
    },
    {
        "id": "fundamental",
        "title": "② 基本面与财务",
        "subtitle": "回答：公司赚钱吗？贵不贵？",
        "rows": [
            ["三表数据", "利润/资产负债/现金流", "SEC EDGAR / 巨潮", "免费", "财报季更新"],
            ["估值指标", "PE/PB/PS/股息", "AkShare / yfinance", "免费", "stock_value_em / info"],
            ["分析师预测", "一致预期 EPS", "东方财富 / yfinance", "免费", "targetMeanPrice"],
        ],
    },
    {
        "id": "macro",
        "title": "③ 宏观与行业",
        "subtitle": "回答：大环境是否支持加仓？",
        "rows": [
            ["利率", "美联储、LPR", "FRED / 央行", "免费", "FEDFUNDS"],
            ["通胀就业", "CPI、非农", "FRED", "免费", "CPIAUCSL"],
            ["行业景气", "PMI、出货量", "AkShare", "免费", "行业指数"],
        ],
    },
    {
        "id": "news",
        "title": "④ 资讯与舆情",
        "subtitle": "回答：发生了什么可能影响股价？",
        "rows": [
            ["7×24快讯", "实时新闻", "财联社 / 雅虎", "免费", "stock_news_em"],
            ["公告", "财报、回购", "SEC / 巨潮", "免费", "RSS"],
            ["情绪", "VIX、融资余额", "FRED / 交易所", "免费", "VIXCLS"],
        ],
    },
]
