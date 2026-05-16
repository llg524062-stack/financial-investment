"""Rule-based scoring and human-readable investment insights."""
from __future__ import annotations

from app.schemas import ForecastScenario
from app.utils import format_pct, pct_change


def score_stock(
    change_30d: float,
    pe: float | None,
    roe: float | None,
    macro_risk: float = 50.0,
) -> tuple[int, str, str]:
    """Return score 0-100, label, score_type."""
    score = 60.0
    if change_30d > 15:
        score -= 12
    elif change_30d > 5:
        score -= 4
    elif change_30d < -10:
        score += 6

    if pe is not None:
        if pe > 80:
            score -= 15
        elif pe > 45:
            score -= 8
        elif pe < 20:
            score += 5

    if roe is not None:
        if roe > 20:
            score += 8
        elif roe < 5:
            score -= 6

    score += (50 - macro_risk) * 0.1
    score = max(20, min(95, int(round(score))))

    if score >= 75:
        return score, "偏多", "up"
    if score >= 60:
        return score, "谨慎偏多", "warn"
    if score >= 45:
        return score, "中性", "neutral"
    return score, "观望", "down"


def build_verdict(score: int, change_30d: float, pe: float | None) -> tuple[str, str, str]:
    if score >= 72 and change_30d < 12:
        return "可以考虑，但别追高", "caution", "持有 / 回调后分批买入"
    if score >= 60:
        return "谨慎参与，控制仓位", "caution", "持有为主，回调加仓"
    if score < 45:
        return "暂时观望", "avoid", "减少敞口，等待更清晰信号"
    return "中性持有", "hold", "维持现有仓位"


def build_forecast_scenarios(
    price: float,
    target_low: float | None,
    target_mean: float | None,
    target_high: float | None,
) -> list[ForecastScenario]:
    if target_mean and price > 0:
        bull = target_high or target_mean * 1.15
        base = target_mean
        bear = target_low or target_mean * 0.85
    else:
        bull = price * 1.2
        base = price * 1.08
        bear = price * 0.88

    return [
        ForecastScenario(
            name="乐观",
            probability=0.35,
            target_range=f"${bull:.0f}-${bull * 1.05:.0f}",
            drivers="业绩超预期、行业景气延续",
        ),
        ForecastScenario(
            name="基准",
            probability=0.45,
            target_range=f"${base * 0.95:.0f}-${base * 1.05:.0f}",
            drivers="业绩符合预期、估值温和消化",
        ),
        ForecastScenario(
            name="悲观",
            probability=0.20,
            target_range=f"${bear * 0.9:.0f}-${bear:.0f}",
            drivers="宏观收紧、竞争加剧或估值回调",
        ),
    ]


def index_insight(sp_ret: float, ndq_ret: float, csi_ret: float, period_label: str) -> str:
    leader = max([("纳指", ndq_ret), ("标普", sp_ret), ("沪深300", csi_ret)], key=lambda x: x[1])
    laggard = min([("纳指", ndq_ret), ("标普", sp_ret), ("沪深300", csi_ret)], key=lambda x: x[1])
    return (
        f"近{period_label}{leader[0]}涨幅领先（{format_pct(leader[1])}），"
        f"{laggard[0]}相对偏弱（{format_pct(laggard[1])}）。"
        f"全球成长风格{'偏强' if ndq_ret > csi_ret else '分化'}，注意跨市场仓位再平衡。"
    )
