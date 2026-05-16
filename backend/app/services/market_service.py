"""Read models for API — DB first, live fetch fallback."""
from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AnalystForecast, DailyQuote, FundamentalSnapshot, IndexDaily, MacroSnapshot, NewsItem, Symbol
from app.schemas import (
    AlertItem,
    IndexCard,
    MarketIndexPeriod,
    NewsArticle,
    QuoteBar,
    StockRowItem,
    SymbolDashboard,
    SymbolInfo,
)
from app.services import analyzer, data_clients
from app.services.analyzer import build_forecast_scenarios, build_verdict, index_insight, score_stock
from app.utils import format_pct, format_price, is_cn_symbol, normalize_series_to_100, period_to_days, pct_change, sample_dates


def resolve_symbol_info(db: Session, code: str) -> SymbolInfo | None:
    """仅从数据库读取；新标的由 /sync/symbol 后台同步后更新名称。"""
    code = code.upper()
    row = db.get(Symbol, code)
    if row:
        return SymbolInfo(code=row.code, name=row.name, display=f"{row.code} · {row.name}")
    return SymbolInfo(code=code, name=code, display=f"{code} · 待同步")


def get_index_cards(db: Session) -> list[IndexCard]:
    cards: list[IndexCard] = []
    meta_map = {
        "SP500": ("标普 500", "美股大盘"),
        "NASDAQ": ("纳斯达克", "科技股"),
        "CSI300": ("沪深 300", "A股"),
    }
    for key, (label, meta) in meta_map.items():
        rows = db.execute(
            select(IndexDaily).where(IndexDaily.index_code == key).order_by(desc(IndexDaily.trade_date)).limit(2)
        ).scalars().all()
        if len(rows) < 2:
            cards.append(IndexCard(label=label, value="—", change="—", changeType="neutral", meta=meta))
            continue
        chg = pct_change(rows[0].close, rows[1].close)
        ctype = "up" if chg >= 0 else "down"
        val = f"{rows[0].close:,.2f}"
        cards.append(
            IndexCard(label=label, value=val, change=format_pct(chg), changeType=ctype, meta=meta)
        )
    temp_val, temp_chg, temp_type = _market_temperature(db)
    cards.append(
        IndexCard(label="市场温度", value=temp_val, change=temp_chg, changeType=temp_type, meta="综合指数涨跌与 VIX")
    )
    return cards


def _market_temperature(db: Session) -> tuple[str, str, str]:
    """由已同步指数与 VIX 计算，无数据时显示 —。"""
    changes: list[float] = []
    for key in ("SP500", "NASDAQ", "CSI300"):
        rows = db.execute(
            select(IndexDaily).where(IndexDaily.index_code == key).order_by(desc(IndexDaily.trade_date)).limit(2)
        ).scalars().all()
        if len(rows) >= 2:
            changes.append(pct_change(rows[0].close, rows[1].close))
    if not changes:
        return "—", "待同步", "neutral"

    vix = db.execute(
        select(MacroSnapshot).where(MacroSnapshot.series_id == "VIXCLS").limit(1)
    ).scalar_one_or_none()
    score = 50 + sum(changes) / len(changes) * 3
    if vix:
        if vix.value > 25:
            score -= 12
        elif vix.value < 15:
            score += 5

    score = max(0, min(100, int(score)))
    if score >= 65:
        return str(score), "偏热", "warn"
    if score <= 42:
        return str(score), "偏冷", "down"
    return str(score), "中性", "neutral"


def get_index_series(db: Session, period: str) -> MarketIndexPeriod:
    days = period_to_days(period)
    result: dict[str, list[float]] = {"sp500": [], "nasdaq": [], "csi300": []}
    labels: list[str] = []
    code_map = {"sp500": "SP500", "nasdaq": "NASDAQ", "csi300": "CSI300"}

    for k, db_code in code_map.items():
        rows = db.execute(
            select(IndexDaily)
            .where(IndexDaily.index_code == db_code)
            .order_by(IndexDaily.trade_date)
            .limit(days + 5)
        ).scalars().all()
        if not rows:
            result[k] = [100.0]
            continue
        closes = [r.close for r in rows[-days:]]
        result[k] = normalize_series_to_100(closes)
        if not labels:
            labels = [r.trade_date[5:] for r in rows[-days:]]

    if not labels:
        labels = ["W1", "W2", "W3", "W4"]

    lbl, idx = sample_dates(labels, 8)
    for k in result:
        result[k] = [result[k][i] for i in idx if i < len(result[k])]

    sp_ret = (result["sp500"][-1] - 100) if result["sp500"] else 0
    ndq_ret = (result["nasdaq"][-1] - 100) if result["nasdaq"] else 0
    csi_ret = (result["csi300"][-1] - 100) if result["csi300"] else 0
    plabel = {"1m": "1个月", "3m": "3个月", "6m": "6个月", "1y": "1年"}.get(period, period)

    return MarketIndexPeriod(
        labels=lbl,
        sp500=result["sp500"],
        nasdaq=result["nasdaq"],
        csi300=result["csi300"],
        insight=index_insight(sp_ret, ndq_ret, csi_ret, plabel),
    )


def _quotes_df(db: Session, symbol: str) -> pd.DataFrame:
    rows = db.execute(
        select(DailyQuote).where(DailyQuote.symbol == symbol).order_by(DailyQuote.trade_date)
    ).scalars().all()
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(
        [{"date": r.trade_date, "open": r.open, "high": r.high, "low": r.low, "close": r.close, "volume": r.volume} for r in rows]
    )


def get_watchlist(db: Session) -> list[StockRowItem]:
    settings = get_settings()
    items: list[StockRowItem] = []
    for sym in settings.watchlist_symbols:
        if sym in ("000300", "000001"):
            continue
        info = resolve_symbol_info(db, sym)
        df = _quotes_df(db, sym)
        if df.empty or len(df) < 2:
            continue
        chg = pct_change(float(df["close"].iloc[-1]), float(df["close"].iloc[-2]))
        chg30 = pct_change(float(df["close"].iloc[-1]), float(df["close"].iloc[max(0, len(df) - 22)]))
        fund = db.execute(
            select(FundamentalSnapshot).where(FundamentalSnapshot.symbol == sym).order_by(desc(FundamentalSnapshot.id)).limit(1)
        ).scalar_one_or_none()
        pe = fund.pe_ttm if fund else None
        roe = fund.roe if fund else None
        score, label, st = score_stock(chg30, pe, roe)
        items.append(
            StockRowItem(
                symbol=sym,
                name=info.name if info else sym,
                change=format_pct(chg),
                changeType="up" if chg >= 0 else "down",
                score=score,
                scoreLabel=label,
                scoreType=st,  # type: ignore[arg-type]
            )
        )
    return items


def get_alerts(db: Session, scope: str, symbol: str | None = None) -> list[AlertItem]:
    alerts: list[AlertItem] = []
    if scope == "market":
        vix = db.execute(select(MacroSnapshot).where(MacroSnapshot.series_id == "VIXCLS").limit(1)).scalar_one_or_none()
        if vix and vix.value > 20:
            alerts.append(
                AlertItem(
                    id="m-vix",
                    level="warning",
                    icon="⚠",
                    title="VIX 偏高，市场波动加大",
                    description=f"当前 VIX 约 {vix.value:.1f}",
                    suggestion="控制总仓位，避免追高。",
                    scope="market",
                )
            )
        alerts.append(
            AlertItem(
                id="m-fed",
                level="info",
                icon="ℹ",
                title="关注美联储与宏观数据发布",
                description="利率与通胀预期影响成长股估值。",
                suggestion="宏观事件前避免大额加仓。",
                scope="market",
            )
        )
        return alerts

    if not symbol:
        return alerts
    df = _quotes_df(db, symbol)
    if len(df) >= 22:
        chg30 = pct_change(float(df["close"].iloc[-1]), float(df["close"].iloc[-22]))
        if chg30 > 15:
            alerts.append(
                AlertItem(
                    id=f"{symbol}-mom",
                    level="critical",
                    icon="🔴",
                    title=f"30 天涨幅 {format_pct(chg30)} — 短期涨太猛",
                    description="触发：30 日涨幅 > 15%",
                    suggestion="不追高，等回调后分批进场。",
                    scope="symbol",
                )
            )
    fund = db.execute(
        select(FundamentalSnapshot).where(FundamentalSnapshot.symbol == symbol).order_by(desc(FundamentalSnapshot.id)).limit(1)
    ).scalar_one_or_none()
    if fund and fund.pe_ttm and fund.pe_ttm > 50:
        alerts.append(
            AlertItem(
                id=f"{symbol}-pe",
                level="warning",
                icon="⚠",
                title=f"估值偏高 PE {fund.pe_ttm:.1f}x",
                description="市盈率显著高于历史中位数区间",
                suggestion="新买入宜等待更合理价格。",
                scope="symbol",
            )
        )
    return alerts


def get_symbol_dashboard(db: Session, symbol: str) -> SymbolDashboard:
    symbol = symbol.upper()
    info = resolve_symbol_info(db, symbol)
    df = _quotes_df(db, symbol)

    price = float(df["close"].iloc[-1]) if not df.empty else 0.0
    chg30 = (
        pct_change(float(df["close"].iloc[-1]), float(df["close"].iloc[max(0, len(df) - 22)]))
        if len(df) > 1
        else 0.0
    )

    fund = db.execute(
        select(FundamentalSnapshot).where(FundamentalSnapshot.symbol == symbol).order_by(desc(FundamentalSnapshot.id)).limit(1)
    ).scalar_one_or_none()
    pe = fund.pe_ttm if fund else None
    roe = fund.roe if fund else None
    score, _, _ = score_stock(chg30, pe, roe)
    verdict, level, _ = build_verdict(score, chg30, pe)

    fc_row = db.execute(
        select(AnalystForecast).where(AnalystForecast.symbol == symbol).order_by(desc(AnalystForecast.id)).limit(1)
    ).scalar_one_or_none()

    scenarios = build_forecast_scenarios(
        price,
        fc_row.target_low if fc_row else None,
        fc_row.target_mean if fc_row else None,
        fc_row.target_high if fc_row else None,
    )

    if df.empty:
        summary = f"{symbol} 暂无入库行情，请执行 POST /api/sync/symbol/{symbol} 或全量同步后刷新。"
    else:
        summary = (
            f"当前价 {format_price(price, is_cn_symbol(symbol))}，近30日{format_pct(chg30)}。"
            f"综合得分 {score}，{verdict}。"
        )

    return SymbolDashboard(
        symbol=symbol,
        name=info.name if info else symbol,
        price=price,
        change_pct=chg30,
        verdict=verdict,
        verdict_level=level,  # type: ignore[arg-type]
        summary=summary,
        score=score,
        dimensions={
            "profit": min(100, int((roe or 30) + 20)),
            "valuation": max(20, 100 - int((pe or 40) / 1.2)),
            "industry": 78,
            "macro": 62,
        },
        forecast_scenarios=scenarios,
        insight=summary,
    )


def get_quotes(db: Session, symbol: str, period: str) -> list[QuoteBar]:
    df = _quotes_df(db, symbol.upper())
    if df.empty:
        return []
    days = period_to_days(period)
    df = df.tail(days)
    return [
        QuoteBar(
            date=str(r["date"]),
            open=float(r["open"]),
            high=float(r["high"]),
            low=float(r["low"]),
            close=float(r["close"]),
            volume=float(r.get("volume") or 0),
        )
        for _, r in df.iterrows()
    ]


def get_news(db: Session, limit: int = 40, symbol: str | None = None) -> list[NewsArticle]:
    q = select(NewsItem).order_by(desc(NewsItem.published_at)).limit(limit)
    if symbol:
        q = select(NewsItem).where((NewsItem.symbol == symbol) | (NewsItem.symbol.is_(None))).order_by(
            desc(NewsItem.published_at)
        ).limit(limit)
    rows = db.execute(q).scalars().all()
    return [
        NewsArticle(
            title=r.title,
            source=r.source,
            url=r.url,
            published_at=r.published_at.isoformat(),
            symbol=r.symbol,
            sentiment=r.sentiment,
        )
        for r in rows
    ]


def get_macro_overview(db: Session) -> list[dict]:
    rows = db.execute(select(MacroSnapshot).order_by(desc(MacroSnapshot.updated_at))).scalars().all()
    return [{"series_id": r.series_id, "label": r.label, "value": r.value, "unit": r.unit, "date": r.trade_date} for r in rows]
