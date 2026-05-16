"""Wrappers for AkShare, yfinance, FRED — all external calls isolated here."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)

CN_NAME_MAP = {
    "600519": "贵州茅台",
    "000300": "沪深300",
    "000001": "上证指数",
}


def is_cn(code: str) -> bool:
    return code.isdigit() and len(code) == 6


def fetch_cn_daily(symbol: str, days: int = 400) -> pd.DataFrame:
    import akshare as ak

    end = datetime.now().strftime("%Y%m%d")
    start = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")
    df = ak.stock_zh_a_hist(symbol=symbol, period="daily", start_date=start, end_date=end, adjust="qfq")
    if df is None or df.empty:
        return pd.DataFrame()
    df = df.rename(
        columns={
            "日期": "date",
            "开盘": "open",
            "收盘": "close",
            "最高": "high",
            "最低": "low",
            "成交量": "volume",
        }
    )
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    return df[["date", "open", "high", "low", "close", "volume"]]


def fetch_us_daily(symbol: str, days: int = 400) -> pd.DataFrame:
    import yfinance as yf

    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=f"{days}d", auto_adjust=True)
    if hist is None or hist.empty:
        return pd.DataFrame()
    hist = hist.reset_index()
    hist["date"] = pd.to_datetime(hist["Date"]).dt.strftime("%Y-%m-%d")
    return hist.rename(columns={"Open": "open", "High": "high", "Low": "low", "Close": "close", "Volume": "volume"})[
        ["date", "open", "high", "low", "close", "volume"]
    ]


def fetch_index_cn(code: str = "000300", days: int = 400) -> pd.DataFrame:
    import akshare as ak

    df = ak.stock_zh_index_daily(symbol=f"sh{code}" if code.startswith("0") else f"sz{code}")
    if df is None or df.empty:
        # fallback CSI 300 via index code
        try:
            df = ak.index_zh_a_hist(symbol=code, period="daily")
            df = df.rename(columns={"日期": "date", "收盘": "close"})
            df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
            return df[["date", "close"]].tail(days)
        except Exception:
            return pd.DataFrame()
    df = df.rename(columns={"date": "date", "close": "close"})
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    return df.tail(days)


def fetch_index_us(ticker: str, days: int = 400) -> pd.DataFrame:
    return fetch_us_daily(ticker, days)


def fetch_cn_news(limit: int = 30) -> list[dict[str, Any]]:
    import akshare as ak

    items: list[dict[str, Any]] = []
    try:
        df = ak.stock_news_em(symbol="全部")
        if df is not None and not df.empty:
            for _, row in df.head(limit).iterrows():
                items.append(
                    {
                        "title": str(row.get("新闻标题", row.get("title", ""))),
                        "source": str(row.get("文章来源", "东方财富")),
                        "url": str(row.get("新闻链接", row.get("url", ""))),
                        "published_at": str(row.get("发布时间", datetime.now().isoformat())),
                    }
                )
    except Exception as e:
        logger.warning("CN news fetch failed: %s", e)
    if not items:
        try:
            df = ak.news_economic_baidu()
            if df is not None and not df.empty:
                for _, row in df.head(limit).iterrows():
                    items.append(
                        {
                            "title": str(row.iloc[1] if len(row) > 1 else row.iloc[0]),
                            "source": "百度财经",
                            "url": "",
                            "published_at": datetime.now().isoformat(),
                        }
                    )
        except Exception as e:
            logger.warning("Baidu news fallback failed: %s", e)
    return items[:limit]


def fetch_us_news(symbol: str, limit: int = 20) -> list[dict[str, Any]]:
    import yfinance as yf

    items: list[dict[str, Any]] = []
    try:
        t = yf.Ticker(symbol)
        news = t.news or []
        for n in news[:limit]:
            items.append(
                {
                    "title": n.get("title", ""),
                    "source": n.get("publisher", "Yahoo"),
                    "url": n.get("link", ""),
                    "published_at": datetime.fromtimestamp(n.get("providerPublishTime", 0)).isoformat()
                    if n.get("providerPublishTime")
                    else datetime.now().isoformat(),
                    "symbol": symbol,
                }
            )
    except Exception as e:
        logger.warning("US news %s failed: %s", symbol, e)
    return items


def fetch_us_fundamentals(symbol: str) -> dict[str, Any]:
    import yfinance as yf

    t = yf.Ticker(symbol)
    info = t.info or {}
    return {
        "pe_ttm": info.get("trailingPE"),
        "pb": info.get("priceToBook"),
        "roe": (info.get("returnOnEquity") or 0) * 100 if info.get("returnOnEquity") else None,
        "revenue_yoy": None,
        "gross_margin": (info.get("grossMargins") or 0) * 100 if info.get("grossMargins") else None,
        "target_low": info.get("targetLowPrice"),
        "target_mean": info.get("targetMeanPrice"),
        "target_high": info.get("targetHighPrice"),
        "recommendation": info.get("recommendationKey", "hold"),
        "name": info.get("shortName") or symbol,
    }


def fetch_cn_fundamentals(symbol: str) -> dict[str, Any]:
    import akshare as ak

    out: dict[str, Any] = {"name": CN_NAME_MAP.get(symbol, symbol)}
    try:
        df = ak.stock_financial_analysis_indicator(symbol=symbol)
        if df is not None and not df.empty:
            latest = df.iloc[-1]
            out["roe"] = _safe_float(latest.get("净资产收益率(%)"))
            out["gross_margin"] = _safe_float(latest.get("销售毛利率(%)"))
    except Exception as e:
        logger.warning("CN fundamentals %s: %s", symbol, e)
    try:
        df = ak.stock_value_em(symbol=symbol)
        if df is not None and not df.empty:
            row = df.iloc[-1]
            out["pe_ttm"] = _safe_float(row.get("PE(TTM)") or row.get("市盈率"))
            out["pb"] = _safe_float(row.get("市净率"))
    except Exception as e:
        logger.warning("CN valuation %s: %s", symbol, e)
    return out


def fetch_cn_analyst_forecast(symbol: str) -> dict[str, Any]:
    import akshare as ak

    try:
        df = ak.stock_profit_forecast_em(symbol=symbol)
        if df is None or df.empty:
            return {}
        row = df.iloc[0]
        return {
            "target_mean": _safe_float(row.get("预测年报每股收益") or row.get("每股收益")),
            "recommendation": "hold",
        }
    except Exception as e:
        logger.warning("CN forecast %s: %s", symbol, e)
        return {}


def fetch_commodity_snapshots() -> list[dict[str, Any]]:
    """大宗商品最新价与涨跌幅（yfinance）。"""
    import yfinance as yf

    mapping = {"WTI 原油": "CL=F", "黄金": "GC=F", "铜": "HG=F", "天然气": "NG=F"}
    out: list[dict[str, Any]] = []
    for label, ticker in mapping.items():
        try:
            hist = yf.Ticker(ticker).history(period="5d", auto_adjust=True)
            if hist is None or hist.empty:
                continue
            last = float(hist["Close"].iloc[-1])
            prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else last
            chg = (last - prev) / prev * 100 if prev else 0.0
            out.append(
                {
                    "series_id": f"CMD_{ticker}",
                    "label": label,
                    "value": last,
                    "change_pct": chg,
                }
            )
        except Exception as e:
            logger.warning("Commodity %s failed: %s", ticker, e)
    return out


def fetch_fred_series(series_id: str, api_key: str) -> pd.Series | None:
    if not api_key:
        return None
    try:
        from fredapi import Fred

        fred = Fred(api_key=api_key)
        s = fred.get_series(series_id)
        return s.dropna().tail(120)
    except Exception as e:
        logger.warning("FRED %s: %s", series_id, e)
        return None


def _safe_float(v: Any) -> float | None:
    try:
        if v is None or (isinstance(v, float) and pd.isna(v)):
            return None
        return float(v)
    except (TypeError, ValueError):
        return None
