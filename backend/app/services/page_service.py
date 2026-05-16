"""Prototype-aligned page payloads for frontend panels."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.data.static_catalog import DATA_SOURCE_CATEGORIES, MONITOR_RULES
from app.models import FundamentalSnapshot, IndexDaily, MacroSnapshot
from app.services import financial_service, market_service, symbol_content
from app.utils import format_pct, format_price, is_cn_symbol

_PORTFOLIO_FILE = Path("data/portfolio.json")

DEFAULT_PORTFOLIO = {
    "holdings": [
        {"symbol": "NVDA", "name": "NVDA", "shares": 50, "cost": 95.0, "weight": 35},
        {"symbol": "MSFT", "name": "MSFT", "shares": 30, "cost": 380.0, "weight": 30},
        {"symbol": "600519", "name": "600519", "shares": 10, "cost": 1650.0, "weight": 20},
    ],
}


def _last_quote(db: Session, symbol: str) -> dict[str, float]:
    bars = market_service.get_quotes(db, symbol, "1m")
    if not bars:
        return {"open": 0, "high": 0, "low": 0, "close": 0, "volume": 0}
    b = bars[-1]
    return {"open": b.open, "high": b.high, "low": b.low, "close": b.close, "volume": b.volume}


def _empty_level2() -> dict[str, Any]:
    return {"bids": [], "asks": [], "source": "unavailable"}


def extend_symbol_dashboard(db: Session, symbol: str) -> dict[str, Any]:
    symbol = symbol.upper()
    dash = market_service.get_symbol_dashboard(db, symbol)
    info = market_service.resolve_symbol_info(db, symbol)
    name = info.name if info else symbol
    fund = symbol_content._fund_row(db, symbol)
    pe = fund.pe_ttm if fund else None
    pb = fund.pb if fund else None
    roe = fund.roe if fund else None

    sym_alerts = market_service.get_alerts(db, "symbol", symbol)
    checklist = symbol_content.build_weekly_checklist(symbol, name, dash.change_pct, sym_alerts, pe)
    ai_points = symbol_content.build_ai_points(
        symbol, name, dash.score, dash.verdict, dash.change_pct, pe, roe
    )
    history_events, history_from_news = symbol_content.build_history_from_news(db, symbol)

    trend_human = (
        f"近一个月 {name}（{symbol}）股价{format_pct(dash.change_pct)}，"
        f"{'涨得比较快，短期有回调风险' if dash.change_pct > 10 else '波动相对温和'}。"
        f"当前价 {format_price(dash.price, is_cn_symbol(symbol))}。"
    )
    valuation_text = (
        f"市盈率 PE {'约 ' + f'{pe:.1f}x' if pe else '暂无'}，"
        f"市净率 PB {'约 ' + f'{pb:.1f}x' if pb else '暂无'}。"
        f"{'估值偏贵，新资金宜等待更好买点' if pe and pe > 50 else '请结合行业与盈利增速综合判断。'}"
    )

    base = dash.model_dump()
    base.update(
        {
            "checklist": checklist,
            "trend_human": trend_human,
            "valuation_text": valuation_text,
            "ai_points": ai_points,
            "history_events": history_events,
            "history_from_news": history_from_news,
            "peer_heatmap": symbol_content.build_peer_heatmap(db, symbol),
            "price_cards": symbol_content.build_price_cards(
                db, symbol, dash.price, dash.change_pct, dash.score, dash.verdict, pe, pb
            ),
            "composite_advice": dash.insight,
            "insight_source": "rules",
            "llm_status": "disabled",
            "inline_alerts": [a.model_dump() for a in sym_alerts[:2]],
            "data_ready": dash.price > 0,
        }
    )
    return base


def get_market_page(db: Session, symbol: str) -> dict[str, Any]:
    q = _last_quote(db, symbol)
    price = q["close"]
    bars = market_service.get_quotes(db, symbol, "3m")
    has_live = len(bars) > 0
    closes = [b.close for b in bars][-60:] or ([price] if price else [100])
    return {
        "symbol": symbol.upper(),
        "ohlc": {
            "open": q["open"],
            "high": q["high"],
            "low": q["low"],
            "close": q["close"],
            "volume": q["volume"],
            "source": "live" if has_live and price > 0 else "unavailable",
        },
        "kline": {
            "labels": [b.date for b in bars][-30:],
            "closes": closes[-30:],
            "source": "live" if has_live else "unavailable",
        },
        "level2": _empty_level2(),
        "options": [],
        "options_source": "unavailable",
    }


def get_fundamental_page(db: Session, symbol: str) -> dict[str, Any]:
    symbol = symbol.upper()
    info = market_service.resolve_symbol_info(db, symbol)
    name = info.name if info else symbol
    fund = symbol_content._fund_row(db, symbol)

    pe = fund.pe_ttm if fund and fund.pe_ttm else None
    pb = fund.pb if fund and fund.pb else None
    roe = fund.roe if fund and fund.roe else None
    rev = fund.revenue_yoy if fund and fund.revenue_yoy is not None else None
    gm = fund.gross_margin if fund and fund.gross_margin else None

    def _fmt(v: float | None, suffix: str = "") -> str:
        return f"{v:.1f}{suffix}" if v is not None else "—"

    overview = [
        {"label": "PE (TTM)", "value": f"{pe:.1f}x" if pe else "—", "meta": "市盈率", "source": "live" if pe else "unavailable"},
        {"label": "PB", "value": f"{pb:.1f}x" if pb else "—", "meta": "市净率", "source": "live" if pb else "unavailable"},
        {"label": "ROE", "value": _fmt(roe, "%"), "meta": "净资产收益率", "source": "live" if roe else "unavailable"},
        {"label": "营收同比", "value": f"{rev:+.0f}%" if rev is not None else "—", "meta": "同比增长", "source": "live" if rev is not None else "unavailable"},
        {"label": "毛利率", "value": _fmt(gm, "%"), "meta": "最新指标", "source": "live" if gm else "unavailable"},
        {"label": "股息率", "value": "—", "meta": "待接入", "source": "unavailable"},
        {"label": "负债率", "value": "—", "meta": "待接入财报", "source": "unavailable"},
        {"label": "FCF Yield", "value": "—", "meta": "待接入", "source": "unavailable"},
    ]

    revenue_chart: dict[str, Any] = {"labels": [], "values": [], "source": "unavailable"}

    fin_live = financial_service.load_financial_statements(symbol)
    if fin_live.get("revenue_chart"):
        revenue_chart = fin_live["revenue_chart"]

    if fin_live.get("tables"):
        tables = fin_live["tables"]
        table_meta = fin_live.get("table_sources", {})
        tables_synthetic = fin_live.get("tables_synthetic", False)
    else:
        tables, table_meta, tables_synthetic = symbol_content.build_fundamental_tables(symbol, name, fund)

    return {
        "symbol": symbol,
        "overview": overview,
        "revenue_chart": revenue_chart,
        "tables": tables,
        "table_sources": table_meta,
        "tables_synthetic": tables_synthetic,
    }


def _macro_rate_card(by_id: dict[str, MacroSnapshot], sid: str, label: str) -> dict[str, str] | None:
    row = by_id.get(sid)
    if not row:
        return None
    unit = row.unit or "%"
    val = f"{row.value:.2f}{unit}" if unit == "%" else f"{row.value:.2f}"
    return {
        "label": label,
        "value": val,
        "meta": f"FRED · {row.trade_date or ''}",
        "source": "live",
    }


def _index_series_normalized(db: Session, code: str, points: int = 6) -> dict[str, Any]:
    rows = db.execute(
        select(IndexDaily)
        .where(IndexDaily.index_code == code)
        .order_by(IndexDaily.trade_date)
        .limit(points + 2)
    ).scalars().all()
    if len(rows) < 2:
        return {"labels": [], "values": [], "source": "unavailable"}
    from app.utils import normalize_series_to_100

    closes = [r.close for r in rows[-points:]]
    labels = [r.trade_date[5:] for r in rows[-points:]]
    return {"labels": labels, "values": normalize_series_to_100(closes), "source": "live"}


def get_macro_page(db: Session) -> dict[str, Any]:
    rows = db.execute(select(MacroSnapshot).order_by(desc(MacroSnapshot.updated_at))).scalars().all()
    by_id = {r.series_id: r for r in rows}
    fred_ids = {k for k in by_id if not k.startswith("CMD_") and not k.startswith("BDI_")}
    has_fred = bool(fred_ids)

    rates = []
    for sid, label in [
        ("FEDFUNDS", "美联储基准利率"),
        ("DGS10", "10年期美债"),
        ("DGS2", "2年期美债"),
    ]:
        card = _macro_rate_card(by_id, sid, label)
        if card:
            rates.append(card)
    if not rates:
        rates = [{"label": "利率数据", "value": "—", "meta": "请配置 FRED_API_KEY 并同步", "source": "unavailable"}]

    yc_labels, yc_values = [], []
    for sid, lbl in [("DGS3MO", "3M"), ("DGS2", "2Y"), ("DGS5", "5Y"), ("DGS10", "10Y"), ("DGS30", "30Y")]:
        if sid in by_id:
            yc_labels.append(lbl)
            yc_values.append(by_id[sid].value)
    yield_curve = {
        "labels": yc_labels,
        "values": yc_values,
        "source": "live" if yc_values else "unavailable",
    }

    liquidity = {
        "rates": rates,
        "yield_curve": yield_curve,
        "money_supply": {"labels": [], "m1": [], "m2": [], "source": "unavailable"},
    }

    vix = by_id.get("VIXCLS")
    gauge_score = 58
    if vix:
        gauge_score = max(20, min(85, int(70 - (vix.value - 15) * 1.5)))
    gauge_label = "偏谨慎" if gauge_score < 50 else "中性" if gauge_score < 65 else "偏乐观"

    economy_cards = []
    if "CPIAUCSL" in by_id:
        cpi = by_id["CPIAUCSL"]
        economy_cards.append(
            {
                "label": "美国 CPI",
                "value": f"{cpi.value:.1f}",
                "change": cpi.trade_date or "—",
                "source": "live",
            }
        )
    if "UNRATE" in by_id:
        un = by_id["UNRATE"]
        economy_cards.append(
            {
                "label": "失业率",
                "value": f"{un.value:.1f}%",
                "change": un.trade_date or "—",
                "source": "live",
            }
        )
    if not economy_cards:
        economy_cards = [{"label": "宏观指标", "value": "—", "change": "待同步 FRED", "source": "unavailable"}]

    economy = {
        "gauge_score": gauge_score,
        "gauge_label": gauge_label,
        "gauge_source": "live" if vix else "rules",
        "social_financing": {"labels": [], "values": [], "source": "unavailable"},
        "cards": economy_cards,
    }

    commodities_rows = []
    for row in rows:
        if not row.series_id.startswith("CMD_"):
            continue
        label = row.label or row.series_id.replace("CMD_", "")
        chg_row = by_id.get(f"{row.series_id}_CHG")
        chg_txt = f"{chg_row.value:+.1f}%" if chg_row else "—"
        commodities_rows.append([label, f"{row.value:.2f}", chg_txt])

    bdi = by_id.get("BDI_PROXY")
    bdi_block = (
        {"value": f"{bdi.value:,.0f}", "change": "—", "source": "live"}
        if bdi
        else {"value": "—", "change": "待接入", "source": "unavailable"}
    )

    industry = {
        "chip_index": _index_series_normalized(db, "SOX", 6),
        "bdi": bdi_block,
        "commodities": commodities_rows
        or [["—", "—", "请执行全量同步拉取大宗商品"]],
        "commodities_source": "live" if commodities_rows else "unavailable",
    }

    return {
        "liquidity": liquidity,
        "economy": economy,
        "industry": industry,
        "fred_configured": has_fred,
    }


def get_news_page(db: Session, symbol: str | None = None) -> dict[str, Any]:
    articles = market_service.get_news(db, 30, symbol)
    vix = db.execute(select(MacroSnapshot).where(MacroSnapshot.series_id == "VIXCLS").limit(1)).scalar_one_or_none()
    vix_val = vix.value if vix else None

    bullish = sum(1 for a in articles if a.sentiment == "positive")
    sentiment_label = "偏多" if bullish > len(articles) / 3 else "中性"

    sentiment_cards = [
        {
            "label": "新闻情绪",
            "value": sentiment_label,
            "meta": f"入库 {len(articles)} 条",
            "source": "live" if articles else "unavailable",
        },
        {
            "label": "VIX 恐慌指数",
            "value": f"{vix_val:.1f}" if vix_val else "—",
            "meta": "偏高" if vix_val and vix_val > 20 else "正常",
            "source": "live" if vix_val else "unavailable",
        },
        {"label": "融资余额", "value": "—", "meta": "待接入交易所", "source": "unavailable"},
        {"label": "分析师评级", "value": "—", "meta": "见个股基本面", "source": "unavailable"},
    ]

    timeline = []
    for a in articles[:5]:
        timeline.append(
            {
                "date": (a.published_at or "")[:10],
                "title": a.title[:100],
                "type": "资讯",
                "source": "live",
            }
        )
    if not timeline:
        timeline = [
            {
                "date": "—",
                "title": "暂无公告时间线（同步新闻后自动填充）",
                "type": "提示",
                "source": "unavailable",
            }
        ]

    flash = [
        {
            "time": a.published_at[:16].replace("T", " "),
            "title": a.title,
            "tag": a.sentiment,
            "url": a.url or "#",
            "source": "live",
        }
        for a in articles[:15]
    ]

    return {"sentiment_cards": sentiment_cards, "timeline": timeline, "flash": flash}


def get_insights_page(db: Session, scope: str, symbol: str | None) -> dict[str, Any]:
    watchlist = market_service.get_watchlist(db)
    stock_research = []
    targets = watchlist[:4]
    if scope == "symbol" and symbol:
        targets = [r for r in watchlist if r.symbol == symbol.upper()] or targets[:1]

    for row in targets:
        d = market_service.get_symbol_dashboard(db, row.symbol)
        stock_research.append(
            {
                "symbol": row.symbol,
                "name": row.name,
                "verdict": d.verdict,
                "score": d.score,
                "change": row.change,
                "highlight": d.summary[:80],
            }
        )

    watchlist = market_service.get_watchlist(db)
    sector_radar = [
        {
            "sector": row.symbol,
            "heat": row.change,
            "view": row.scoreLabel,
            "symbols": row.name,
        }
        for row in watchlist[:6]
    ]
    articles = market_service.get_news(db, 8, symbol if scope == "symbol" else None)
    timeline = [
        {
            "date": (a.published_at or "")[:10] or "—",
            "event": a.title[:80],
            "impact": a.sentiment or "资讯",
            "source": "live",
        }
        for a in articles[:5]
    ]
    if not timeline:
        timeline = [{"date": "—", "event": "暂无资讯，请执行数据同步", "impact": "—", "source": "unavailable"}]

    series = market_service.get_index_series(db, "3m")
    macro_panel = {
        "title": "宏观仓位建议（规则）",
        "position": "中性" if "谨慎" in series.insight else "灵活",
        "sectors": series.insight[:60],
        "risk": "数据来自已同步指数与 FRED，请结合个股基本面决策。",
        "source": "rules",
    }

    return {
        "scope": scope,
        "stock_research": stock_research,
        "sector_radar": sector_radar,
        "sector_radar_source": "live" if sector_radar else "unavailable",
        "macro_panel": macro_panel,
        "timeline": timeline,
        "insight_source": "rules",
    }


def get_alerts_page(db: Session, scope: str, symbol: str | None) -> dict[str, Any]:
    alerts = market_service.get_alerts(db, scope, symbol)
    watchlist_alerts = []
    for row in market_service.get_watchlist(db):
        sym_alerts = market_service.get_alerts(db, "symbol", row.symbol)
        if sym_alerts:
            watchlist_alerts.append(
                {"symbol": row.symbol, "name": row.name, "alerts": [a.model_dump() for a in sym_alerts]}
            )
    return {
        "alerts": [a.model_dump() for a in alerts],
        "monitor_rules": MONITOR_RULES,
        "monitor_rules_source": "static",
        "watchlist_alerts": watchlist_alerts,
    }


def _watchlist_heatmap(db: Session) -> list[dict[str, object]]:
    heat: list[dict[str, object]] = []
    for row in market_service.get_watchlist(db):
        try:
            chg = float(str(row.change).replace("%", "").replace("+", ""))
        except ValueError:
            chg = 0.0
        level = 2 if chg > 2 else 1 if chg > 0 else 0 if chg == 0 else -1 if chg > -2 else -2
        heat.append({"name": row.symbol, "change": chg, "level": level})
    return heat


def get_market_dashboard_extras(db: Session) -> dict[str, Any]:
    vix = db.execute(select(MacroSnapshot).where(MacroSnapshot.series_id == "VIXCLS").limit(1)).scalar_one_or_none()
    vix_score = 62 if not vix else (55 if vix.value > 20 else 68)
    series = market_service.get_index_series(db, "3m")
    sp_ret = (series.sp500[-1] - 100) if series.sp500 else 0

    return {
        "industry_heatmap": _watchlist_heatmap(db),
        "industry_heatmap_source": "live",
        "market_advice": {
            "position": "中性偏谨慎" if vix and vix.value > 22 else "中性",
            "direction": series.insight[:40],
            "action": "控制仓位，优先持有基本面扎实的标的" if sp_ret < 0 else "顺势但避免追高",
        },
        "market_advice_source": "rules",
        "environment": [
            {"label": "估值", "score": max(30, min(80, 58 - int(sp_ret))), "desc": "来自指数回报"},
            {"label": "盈利", "score": 72, "desc": "watchlist 综合"},
            {"label": "流动性", "score": 55 if vix and vix.value > 18 else 65, "desc": "利率/VIX"},
            {"label": "情绪", "score": vix_score, "desc": "VIX 偏高" if vix and vix.value > 20 else "正常"},
        ],
        "environment_source": "rules",
    }


def get_settings_page() -> dict[str, Any]:
    return {"categories": DATA_SOURCE_CATEGORIES}


def _portfolio_performance(db: Session, holdings: list[dict[str, Any]]) -> dict[str, Any]:
    """按持仓权重合成净值曲线（仅使用已同步日线）。"""
    if not holdings:
        return {"labels": [], "values": [], "source": "unavailable"}

    import pandas as pd

    frames: list[pd.Series] = []
    weights: list[float] = []
    for h in holdings:
        sym = str(h["symbol"]).upper()
        bars = market_service.get_quotes(db, sym, "6m")
        if not bars:
            continue
        w = float(h.get("weight") or 1)
        weights.append(w)
        s = pd.Series({b.date: b.close for b in bars}).sort_index()
        frames.append(s)

    if not frames:
        return {"labels": [], "values": [], "source": "unavailable"}

    combined = pd.concat(frames, axis=1).dropna(how="all").ffill().dropna()
    if combined.empty:
        return {"labels": [], "values": [], "source": "unavailable"}

    w_arr = weights[: len(combined.columns)]
    total_w = sum(w_arr) or 1
    norm = combined.div(combined.iloc[0]).mul([w / total_w for w in w_arr], axis=1).sum(axis=1)
    norm = (norm / norm.iloc[0] * 100).tail(24)
    labels = [d[5:] for d in norm.index.tolist()]
    return {"labels": labels, "values": [round(float(v), 2) for v in norm.values], "source": "live"}


def _portfolio_metrics(holdings: list[dict[str, Any]], perf: dict[str, Any]) -> dict[str, Any]:
    if not holdings or not perf.get("values"):
        return {"sharpe": 0.0, "max_drawdown": "—", "total_return": "—"}

    values = perf["values"]
    total_ret = (values[-1] - values[0]) / values[0] * 100 if values[0] else 0
    peak = values[0]
    max_dd = 0.0
    for v in values:
        peak = max(peak, v)
        dd = (v - peak) / peak * 100 if peak else 0
        max_dd = min(max_dd, dd)

    returns = []
    for i in range(1, len(values)):
        if values[i - 1]:
            returns.append((values[i] - values[i - 1]) / values[i - 1])
    import statistics

    sharpe = 0.0
    if len(returns) > 2:
        avg = statistics.mean(returns)
        std = statistics.pstdev(returns) or 1e-6
        sharpe = round(avg / std * (252**0.5), 2)

    return {
        "sharpe": sharpe,
        "max_drawdown": f"{max_dd:.1f}%",
        "total_return": f"{total_ret:+.1f}%",
    }


def get_portfolio(db: Session) -> dict[str, Any]:
    path = _PORTFOLIO_FILE
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            data = DEFAULT_PORTFOLIO.copy()
    else:
        data = DEFAULT_PORTFOLIO.copy()

    holdings = []
    for h in data.get("holdings", []):
        sym = h["symbol"]
        dash = market_service.get_symbol_dashboard(db, sym)
        cost = float(h.get("cost") or 0)
        price = dash.price
        pnl = ((price - cost) / cost * 100) if cost and price else dash.change_pct
        info = market_service.resolve_symbol_info(db, sym)
        holdings.append(
            {
                **h,
                "name": info.name if info else sym,
                "price": price,
                "pnl_pct": round(pnl, 2) if pnl is not None else 0,
            }
        )
    perf = _portfolio_performance(db, holdings)
    metrics = _portfolio_metrics(holdings, perf)
    data["holdings"] = holdings
    data["performance"] = perf
    data["metrics"] = metrics
    data["performance_source"] = perf.get("source", "unavailable")
    data["metrics_source"] = perf.get("source", "unavailable")
    return data


def save_portfolio(payload: dict[str, Any]) -> dict[str, Any]:
    path = _PORTFOLIO_FILE
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload
