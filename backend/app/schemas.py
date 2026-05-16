from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = 0
    message: str = "ok"
    data: T | None = None
    success: bool = True


class SymbolInfo(BaseModel):
    code: str
    name: str
    display: str


class IndexCard(BaseModel):
    label: str
    value: str
    change: str
    changeType: Literal["up", "down", "warn", "neutral"]
    meta: str


class StockRowItem(BaseModel):
    symbol: str
    name: str
    change: str
    changeType: Literal["up", "down"]
    score: int
    scoreLabel: str
    scoreType: Literal["up", "warn", "neutral", "down"]


class AlertItem(BaseModel):
    id: str
    level: Literal["critical", "warning", "info"]
    icon: str
    title: str
    description: str
    suggestion: str
    scope: Literal["market", "symbol"] | None = None


class MarketIndexPeriod(BaseModel):
    labels: list[str]
    sp500: list[float]
    nasdaq: list[float]
    csi300: list[float]
    insight: str


class QuoteBar(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float = 0


class ForecastScenario(BaseModel):
    name: str
    probability: float
    target_range: str
    drivers: str


class SymbolDashboard(BaseModel):
    symbol: str
    name: str
    price: float
    change_pct: float
    verdict: str
    verdict_level: Literal["buy", "caution", "hold", "avoid"]
    summary: str
    score: int
    dimensions: dict[str, int]
    forecast_scenarios: list[ForecastScenario]
    insight: str
    history_highlights: list[dict[str, Any]] = Field(default_factory=list)


class NewsArticle(BaseModel):
    title: str
    source: str
    url: str
    published_at: str
    symbol: str | None = None
    sentiment: str = "neutral"


class MacroCard(BaseModel):
    label: str
    value: str
    change: str
    meta: str
