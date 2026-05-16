from __future__ import annotations

import re
from datetime import datetime, timedelta


def is_cn_symbol(code: str) -> bool:
    c = code.strip().upper()
    return bool(re.fullmatch(r"\d{6}", c))


def normalize_symbol(code: str) -> str:
    return code.strip().upper().split(".")[0]


def pct_change(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0
    return (current - previous) / previous * 100


def format_pct(value: float, digits: int = 1) -> str:
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.{digits}f}%"


def format_price(value: float, cn: bool = False) -> str:
    if cn:
        return f"{value:,.2f}"
    return f"${value:,.2f}" if value < 10000 else f"${value:,.0f}"


def period_to_days(period: str) -> int:
    mapping = {"1m": 22, "3m": 66, "6m": 132, "1y": 252}
    return mapping.get(period, 66)


def normalize_series_to_100(values: list[float]) -> list[float]:
    if not values:
        return []
    base = values[0]
    if base == 0:
        return [100.0] * len(values)
    return [round(v / base * 100, 2) for v in values]


def sample_dates(labels: list[str], max_points: int = 12) -> tuple[list[str], list[int]]:
    if len(labels) <= max_points:
        return labels, list(range(len(labels)))
    step = max(1, len(labels) // max_points)
    idx = list(range(0, len(labels), step))
    if idx[-1] != len(labels) - 1:
        idx.append(len(labels) - 1)
    return [labels[i] for i in idx], idx
