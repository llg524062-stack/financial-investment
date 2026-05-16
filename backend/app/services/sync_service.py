"""Persist fetched market data into database."""
from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AnalystForecast, DailyQuote, FundamentalSnapshot, IndexDaily, MacroSnapshot, NewsItem, Symbol
from app.services import data_clients, financial_service

logger = logging.getLogger(__name__)


def sync_symbol(db: Session, code: str) -> None:
    code = code.upper()
    cn = data_clients.is_cn(code)
    market = "CN" if cn else "US"
    try:
        df = data_clients.fetch_cn_daily(code) if cn else data_clients.fetch_us_daily(code)
    except Exception as e:
        logger.error("Quote sync failed %s: %s", code, e)
        return

    if df.empty:
        return

    fund = data_clients.fetch_cn_fundamentals(code) if cn else data_clients.fetch_us_fundamentals(code)
    name = str(fund.get("name") or code)

    db.merge(Symbol(code=code, name=name, market=market, updated_at=datetime.utcnow()))

    db.execute(delete(DailyQuote).where(DailyQuote.symbol == code))
    for _, row in df.iterrows():
        db.add(
            DailyQuote(
                symbol=code,
                trade_date=str(row["date"]),
                open=float(row["open"]),
                high=float(row["high"]),
                low=float(row["low"]),
                close=float(row["close"]),
                volume=float(row.get("volume") or 0),
            )
        )

    db.add(
        FundamentalSnapshot(
            symbol=code,
            pe_ttm=fund.get("pe_ttm"),
            pb=fund.get("pb"),
            roe=fund.get("roe"),
            revenue_yoy=fund.get("revenue_yoy"),
            gross_margin=fund.get("gross_margin"),
            updated_at=datetime.utcnow(),
        )
    )

    if not cn:
        db.add(
            AnalystForecast(
                symbol=code,
                target_low=fund.get("target_low"),
                target_mean=fund.get("target_mean"),
                target_high=fund.get("target_high"),
                recommendation=str(fund.get("recommendation", "hold")),
                updated_at=datetime.utcnow(),
            )
        )
    else:
        fc = data_clients.fetch_cn_analyst_forecast(code)
        if fc:
            db.add(
                AnalystForecast(
                    symbol=code,
                    target_mean=fc.get("target_mean"),
                    recommendation=str(fc.get("recommendation", "hold")),
                    updated_at=datetime.utcnow(),
                )
            )

    try:
        financial_service.refresh_financial_cache(code)
    except Exception as e:
        logger.warning("Financial cache %s: %s", code, e)

    db.commit()


def sync_indices(db: Session) -> None:
    mapping = {"SP500": "^GSPC", "NASDAQ": "^IXIC", "CSI300": "000300", "SOX": "^SOX"}
    for key, ticker in mapping.items():
        try:
            if key == "CSI300":
                df = data_clients.fetch_index_cn("000300")
            else:
                df = data_clients.fetch_index_us(ticker)
            if df.empty:
                continue
            db.execute(delete(IndexDaily).where(IndexDaily.index_code == key))
            for _, row in df.iterrows():
                close_col = "close" if "close" in row else row.iloc[-1]
                db.add(
                    IndexDaily(
                        index_code=key,
                        trade_date=str(row["date"]),
                        close=float(row[close_col]),
                    )
                )
            db.commit()
        except Exception as e:
            logger.error("Index sync %s failed: %s", key, e)


def sync_news(db: Session, symbols: list[str]) -> None:
    items = data_clients.fetch_cn_news(40)
    for s in symbols[:5]:
        if not data_clients.is_cn(s):
            items.extend(data_clients.fetch_us_news(s, 10))
    db.execute(delete(NewsItem))
    for it in items[:80]:
        db.add(
            NewsItem(
                title=it.get("title", "")[:500],
                source=it.get("source", ""),
                url=it.get("url", "")[:1000],
                published_at=datetime.utcnow(),
                symbol=it.get("symbol"),
                sentiment="neutral",
            )
        )
    db.commit()


def sync_macro(db: Session) -> None:
    settings = get_settings()
    db.execute(delete(MacroSnapshot))

    if settings.fred_api_key:
        series = [
            ("FEDFUNDS", "联邦基金利率", "%"),
            ("DGS10", "10年期美债收益率", "%"),
            ("DGS2", "2年期美债", "%"),
            ("DGS3MO", "3个月美债", "%"),
            ("DGS5", "5年期美债", "%"),
            ("DGS30", "30年期美债", "%"),
            ("VIXCLS", "VIX恐慌指数", ""),
            ("CPIAUCSL", "美国CPI", "index"),
            ("UNRATE", "美国失业率", "%"),
        ]
        for sid, label, unit in series:
            s = data_clients.fetch_fred_series(sid, settings.fred_api_key)
            if s is None or s.empty:
                continue
            last = s.iloc[-1]
            db.add(
                MacroSnapshot(
                    series_id=sid,
                    label=label,
                    value=float(last),
                    unit=unit,
                    trade_date=str(s.index[-1])[:10],
                    updated_at=datetime.utcnow(),
                )
            )
    else:
        logger.info("FRED_API_KEY not set, skip FRED macro series")

    for cmd in data_clients.fetch_commodity_snapshots():
        db.add(
            MacroSnapshot(
                series_id=cmd["series_id"],
                label=cmd["label"],
                value=float(cmd["value"]),
                unit="$",
                trade_date=datetime.utcnow().strftime("%Y-%m-%d"),
                updated_at=datetime.utcnow(),
            )
        )
        db.add(
            MacroSnapshot(
                series_id=f"{cmd['series_id']}_CHG",
                label=cmd["label"],
                value=float(cmd["change_pct"]),
                unit="%",
                trade_date=datetime.utcnow().strftime("%Y-%m-%d"),
                updated_at=datetime.utcnow(),
            )
        )
    db.commit()


def run_full_sync(db: Session) -> None:
    settings = get_settings()
    logger.info("Starting full data sync...")
    sync_indices(db)
    for sym in settings.watchlist_symbols:
        if sym in ("000300", "000001"):
            continue
        sync_symbol(db, sym)
    sync_news(db, settings.watchlist_symbols)
    sync_macro(db)
    logger.info("Full data sync completed.")
