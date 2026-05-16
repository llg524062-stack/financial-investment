"""Fetch and format income / balance / cashflow tables from yfinance & AkShare."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import pandas as pd

from app.utils import is_cn_symbol

_FIN_CACHE_DIR = Path("data/financials")

logger = logging.getLogger(__name__)

# yfinance row labels (try in order)
INCOME_ROWS = ["Total Revenue", "Operating Revenue", "Gross Profit", "Operating Income", "Net Income"]
BALANCE_ROWS = ["Total Assets", "Total Liabilities Net Minority Interest", "Total Equity Gross Minority Interest", "Stockholders Equity"]
CASHFLOW_ROWS = ["Operating Cash Flow", "Investing Cash Flow", "Financing Cash Flow", "Free Cash Flow"]


def _fmt_num(v: float | None) -> str:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return "—"
    av = abs(float(v))
    if av >= 1e12:
        return f"{float(v) / 1e12:.2f}T"
    if av >= 1e9:
        return f"{float(v) / 1e9:.2f}B"
    if av >= 1e6:
        return f"{float(v) / 1e6:.2f}M"
    return f"{float(v):,.0f}"


def _qoq_pct(cur: float | None, prev: float | None) -> str:
    if cur is None or prev is None or prev == 0 or pd.isna(cur) or pd.isna(prev):
        return "—"
    pct = (float(cur) - float(prev)) / abs(float(prev)) * 100
    return f"{pct:+.1f}% QoQ"


def _df_section_rows(df: pd.DataFrame | None, row_names: list[str], max_rows: int = 6) -> list[list[str]]:
    if df is None or df.empty or len(df.columns) < 1:
        return []
    cols = list(df.columns)
    q0 = cols[0]
    q1 = cols[1] if len(cols) > 1 else None
    q_label = str(q0)[:7] if hasattr(q0, "__str__") else str(q0)

    rows: list[list[str]] = []
    for name in row_names:
        matched = None
        for idx in df.index:
            if name.lower() in str(idx).lower():
                matched = idx
                break
        if matched is None:
            continue
        cur = df.loc[matched, q0] if matched in df.index else None
        prev = df.loc[matched, q1] if q1 and matched in df.index else None
        rows.append([str(matched), _fmt_num(cur), _qoq_pct(cur, prev), f"季报 {q_label} · yfinance"])
        if len(rows) >= max_rows:
            break
    return rows


def _revenue_series_from_income(df: pd.DataFrame | None) -> dict[str, Any] | None:
    if df is None or df.empty:
        return None
    rev_idx = None
    for name in INCOME_ROWS:
        for idx in df.index:
            if name.lower() in str(idx).lower():
                rev_idx = idx
                break
        if rev_idx is not None:
            break
    if rev_idx is None:
        return None
    cols = list(df.columns)[:5][::-1]  # oldest -> newest
    labels = [str(c)[:7] for c in cols]
    values: list[float] = []
    for c in cols:
        v = df.loc[rev_idx, c]
        values.append(float(v) / 1e9 if v and not pd.isna(v) else 0.0)
    if not values:
        return None
    return {"labels": labels, "values": values, "source": "live"}


def fetch_us_statements(symbol: str) -> dict[str, Any]:
    import yfinance as yf

    t = yf.Ticker(symbol)
    try:
        inc = t.quarterly_income_stmt
        bal = t.quarterly_balance_sheet
        cf = t.quarterly_cashflow
    except Exception as e:
        logger.warning("US financials %s: %s", symbol, e)
        return {}

    income = _df_section_rows(inc, INCOME_ROWS)
    balance = _df_section_rows(bal, BALANCE_ROWS)
    cashflow = _df_section_rows(cf, CASHFLOW_ROWS)
    rev_chart = _revenue_series_from_income(inc)

    if not income and not balance and not cashflow:
        return {}

    return {
        "tables": {
            "income": income or [["—", "无数据", "—", "yfinance 未返回利润表"]],
            "balance": balance or [["—", "无数据", "—", "yfinance 未返回资产负债表"]],
            "cashflow": cashflow or [["—", "无数据", "—", "yfinance 未返回现金流"]],
        },
        "table_sources": {
            "income": "live" if income else "unavailable",
            "balance": "live" if balance else "unavailable",
            "cashflow": "live" if cashflow else "unavailable",
        },
        "tables_synthetic": False,
        "revenue_chart": rev_chart,
    }


def fetch_cn_statements(symbol: str) -> dict[str, Any]:
    import akshare as ak

    income: list[list[str]] = []
    tables_out: dict[str, list[list[str]]] = {"income": [], "balance": [], "cashflow": []}
    for report_name, key in [("利润表", "income"), ("资产负债表", "balance"), ("现金流量表", "cashflow")]:
        try:
            df = ak.stock_financial_report_sina(stock=symbol, symbol=report_name)
            if df is not None and not df.empty:
                row = df.iloc[0]
                for col in list(df.columns)[:6]:
                    val = row.get(col) if col in row.index else None
                    if val is not None and str(val) not in ("", "nan"):
                        tables_out[key].append([str(col), str(val), "—", f"新浪·{report_name}"])
        except Exception as e:
            logger.warning("CN sina report %s %s: %s", symbol, report_name, e)

    if not any(tables_out.values()):
        try:
            df = ak.stock_financial_abstract_ths(symbol=symbol, indicator="按报告期")
            if df is not None and not df.empty:
                latest = df.iloc[0]
                for col in df.columns[:8]:
                    val = latest.get(col)
                    if val is not None and str(val) not in ("", "nan"):
                        income.append([str(col), str(val), "—", "同花顺财务摘要"])
        except Exception as e:
            logger.warning("CN abstract %s: %s", symbol, e)
        tables_out["income"] = income or tables_out["income"]

    if not income:
        try:
            df = ak.stock_financial_analysis_indicator(symbol=symbol)
            if df is not None and not df.empty:
                row = df.iloc[-1]
                for key in ("营业总收入", "净利润", "净资产收益率(%)", "销售毛利率(%)"):
                    if key in row.index:
                        income.append([key, str(row[key]), "—", "东方财富指标"])
        except Exception as e:
            logger.warning("CN indicator %s: %s", symbol, e)

    if not any(tables_out["income"] + tables_out["balance"] + tables_out["cashflow"]):
        return {}

    return {
        "tables": {
            "income": tables_out["income"][:8] or income[:8],
            "balance": tables_out["balance"][:8] or [["说明", "暂无", "—", "AkShare"]],
            "cashflow": tables_out["cashflow"][:8] or [["说明", "暂无", "—", "AkShare"]],
        },
        "table_sources": {
            "income": "live" if tables_out["income"] or income else "unavailable",
            "balance": "live" if tables_out["balance"] else "unavailable",
            "cashflow": "live" if tables_out["cashflow"] else "unavailable",
        },
        "tables_synthetic": False,
    }


def _cache_path(symbol: str) -> Path:
    return _FIN_CACHE_DIR / f"{symbol.upper()}.json"


def refresh_financial_cache(symbol: str) -> dict[str, Any]:
    """同步任务调用：拉取外网财报并写入本地缓存。"""
    symbol = symbol.upper()
    if is_cn_symbol(symbol):
        data = fetch_cn_statements(symbol)
    else:
        data = fetch_us_statements(symbol)
    if data:
        _FIN_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        _cache_path(symbol).write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return data


def load_financial_statements(symbol: str) -> dict[str, Any]:
    """仅从同步缓存读取，不在 HTTP 请求中访问外网。"""
    path = _cache_path(symbol.upper())
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning("Read financial cache %s: %s", symbol, e)
        return {}
