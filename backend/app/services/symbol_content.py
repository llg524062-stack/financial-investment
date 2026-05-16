"""Per-symbol narrative content derived from DB + rules (not hardcoded NVDA copy)."""
from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import FundamentalSnapshot, MacroSnapshot
from app.schemas import AlertItem
from app.services import market_service
from app.utils import format_pct, format_price, is_cn_symbol


def _fund_row(db: Session, symbol: str) -> FundamentalSnapshot | None:
    return db.execute(
        select(FundamentalSnapshot)
        .where(FundamentalSnapshot.symbol == symbol.upper())
        .order_by(desc(FundamentalSnapshot.id))
        .limit(1)
    ).scalar_one_or_none()


def build_weekly_checklist(
    symbol: str,
    name: str,
    change_pct: float,
    alerts: list[AlertItem],
    pe: float | None,
) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for a in alerts[:2]:
        st = "critical" if a.level == "critical" else "warn" if a.level == "warning" else "ok"
        items.append({"item": a.title, "status": st, "detail": a.suggestion})

    if change_pct > 15:
        items.append(
            {
                "item": f"{symbol} 短期涨幅过大",
                "status": "critical",
                "detail": f"30 日 {format_pct(change_pct)}，不宜追高，宜分批等待回调。",
            }
        )
    elif change_pct < -10:
        items.append(
            {
                "item": f"{symbol} 近期回调较深",
                "status": "warn",
                "detail": "下跌中需区分「错杀」与「基本面恶化」，结合下季财报判断。",
            }
        )

    if pe and pe > 50:
        items.append(
            {
                "item": "估值偏高",
                "status": "warn",
                "detail": f"PE TTM 约 {pe:.1f}x，新资金宜等待更合理买点。",
            }
        )

    if len(items) < 3:
        items.append(
            {
                "item": "关注宏观与行业数据",
                "status": "ok",
                "detail": f"在「宏观与行业」「资讯」模块跟踪影响 {name} 的利率、行业景气与新闻。",
            }
        )
    return items[:5]


def build_ai_points(
    symbol: str,
    name: str,
    score: int,
    verdict: str,
    change_pct: float,
    pe: float | None,
    roe: float | None,
) -> list[dict[str, str]]:
    """Rule-based insights — not LLM. Labelled on API as insight_source=rules."""
    points: list[dict[str, str]] = []
    if roe is not None:
        tag = "看多" if roe > 20 else "中性"
        points.append(
            {
                "tag": tag,
                "text": f"盈利：ROE 约 {roe:.1f}%，反映 {name} 的股东回报能力。",
            }
        )
    if pe is not None:
        tag = "风险" if pe > 45 else "中性"
        points.append(
            {
                "tag": tag,
                "text": f"估值：PE TTM 约 {pe:.1f}x，{'偏高需警惕业绩不及预期' if pe > 45 else '处于可接受区间'}。",
            }
        )
    if change_pct > 10:
        points.append({"tag": "风险", "text": f"动量：30 日涨 {format_pct(change_pct)}，短线过热风险上升。"})
    elif change_pct < -8:
        points.append({"tag": "中性", "text": f"动量：30 日跌 {format_pct(change_pct)}，可观察是否出现布局窗口。"})
    points.append({"tag": "操作", "text": f"综合（规则引擎）：{verdict}，得分 {score}/100。"})
    return points[:4]


def build_history_from_news(db: Session, symbol: str) -> tuple[list[dict[str, str]], bool]:
    articles = market_service.get_news(db, 12, symbol)
    if not articles:
        return (
            [
                {
                    "period": "—",
                    "event": "暂无该股相关新闻入库",
                    "reaction": "—",
                    "lesson": "请先执行数据同步（POST /api/sync/run-now），或扩大 watchlist 后重试。",
                }
            ],
            False,
        )
    events = []
    for a in articles[:4]:
        period = (a.published_at or "")[:10] or "近期"
        events.append(
            {
                "period": period,
                "event": a.title[:120],
                "reaction": "—",
                "lesson": f"来源：{a.source or '资讯'}。重大新闻后 1–2 周波动常见，宜结合估值判断。",
            }
        )
    return events, True


def build_peer_heatmap(db: Session, symbol: str) -> list[dict[str, object]]:
    symbol = symbol.upper()
    peers = []
    for row in market_service.get_watchlist(db):
        if row.symbol == symbol:
            continue
        try:
            chg = float(row.change.replace("%", "").replace("+", ""))
        except ValueError:
            chg = 0.0
        level = 2 if chg > 2 else 1 if chg > 0 else 0 if chg == 0 else -1 if chg > -2 else -2
        peers.append({"name": row.symbol, "change": chg, "level": level})
    if not peers:
        return [{"name": symbol, "change": 0.0, "level": 0}]
    return peers[:8]


def build_price_cards(
    db: Session,
    symbol: str,
    price: float,
    change_pct: float,
    score: int,
    verdict: str,
    pe: float | None,
    pb: float | None,
) -> list[dict[str, str]]:
    cards = [
        {"label": "现价", "value": format_price(price, is_cn_symbol(symbol)), "source": "live"},
        {
            "label": "30日涨跌",
            "value": format_pct(change_pct),
            "type": "up" if change_pct >= 0 else "down",
            "source": "live",
        },
    ]
    if pe is not None:
        cards.append({"label": "PE (TTM)", "value": f"{pe:.1f}x", "source": "live"})
    if pb is not None:
        cards.append({"label": "PB", "value": f"{pb:.1f}x", "source": "live"})
    else:
        cards.append({"label": "综合得分", "value": str(score), "source": "rules"})

    vix = db.execute(select(MacroSnapshot).where(MacroSnapshot.series_id == "VIXCLS").limit(1)).scalar_one_or_none()
    if vix:
        cards.append({"label": "VIX", "value": f"{vix.value:.1f}", "source": "live"})
    else:
        cards.append({"label": "结论", "value": verdict[:12], "source": "rules"})

    return cards[:4]


def build_fundamental_tables(
    symbol: str,
    name: str,
    fund: FundamentalSnapshot | None,
) -> tuple[dict[str, list[list[str]]], dict[str, str], bool]:
    """Tables from snapshot only; full statements marked synthetic/unavailable."""
    meta = {"income": "unavailable", "balance": "unavailable", "cashflow": "unavailable"}
    if not fund:
        empty = [
            ["—", "暂无数据", "—", f"请同步 {symbol} 基本面后刷新"],
        ]
        return {"income": empty, "balance": empty, "cashflow": empty}, meta, True

    pe = fund.pe_ttm
    roe = fund.roe
    gm = fund.gross_margin
    rev = fund.revenue_yoy

    income = [
        ["估值快照", name, "—", "来自 yfinance / AkShare 最新指标"],
        ["PE (TTM)", f"{pe:.1f}x" if pe else "—", "—", "实时估值"],
        ["ROE", f"{roe:.1f}%" if roe else "—", "—", "盈利能力"],
        ["毛利率", f"{gm:.1f}%" if gm else "—", "—", "盈利质量"],
        ["营收同比", f"{rev:+.0f}%" if rev is not None else "—", "—", "成长性"],
    ]
    balance = [
        ["说明", "完整资产负债表", "—", "未接入逐季财报 API，仅展示估值快照"],
    ]
    cashflow = [
        ["说明", "完整现金流量表", "—", "未接入逐季财报 API，仅展示估值快照"],
    ]
    meta = {"income": "live", "balance": "unavailable", "cashflow": "unavailable"}
    return {"income": income, "balance": balance, "cashflow": cashflow}, meta, True
