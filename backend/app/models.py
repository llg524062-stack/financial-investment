from datetime import datetime

from sqlalchemy import DateTime, Float, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Symbol(Base):
    __tablename__ = "symbols"

    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), default="")
    market: Mapped[str] = mapped_column(String(8), default="US")  # US | CN
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DailyQuote(Base):
    __tablename__ = "daily_quotes"
    __table_args__ = (UniqueConstraint("symbol", "trade_date", name="uq_quote_symbol_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    symbol: Mapped[str] = mapped_column(String(32), index=True)
    trade_date: Mapped[str] = mapped_column(String(10), index=True)
    open: Mapped[float] = mapped_column(Float)
    high: Mapped[float] = mapped_column(Float)
    low: Mapped[float] = mapped_column(Float)
    close: Mapped[float] = mapped_column(Float)
    volume: Mapped[float] = mapped_column(Float, default=0)


class IndexDaily(Base):
    __tablename__ = "index_daily"
    __table_args__ = (UniqueConstraint("index_code", "trade_date", name="uq_index_code_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    index_code: Mapped[str] = mapped_column(String(32), index=True)
    trade_date: Mapped[str] = mapped_column(String(10))
    close: Mapped[float] = mapped_column(Float)


class NewsItem(Base):
    __tablename__ = "news_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(512))
    source: Mapped[str] = mapped_column(String(64), default="")
    url: Mapped[str] = mapped_column(String(1024), default="")
    published_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    symbol: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    sentiment: Mapped[str] = mapped_column(String(16), default="neutral")


class FundamentalSnapshot(Base):
    __tablename__ = "fundamental_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    symbol: Mapped[str] = mapped_column(String(32), index=True)
    pe_ttm: Mapped[float | None] = mapped_column(Float, nullable=True)
    pb: Mapped[float | None] = mapped_column(Float, nullable=True)
    roe: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue_yoy: Mapped[float | None] = mapped_column(Float, nullable=True)
    gross_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AnalystForecast(Base):
    __tablename__ = "analyst_forecasts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    symbol: Mapped[str] = mapped_column(String(32), index=True)
    target_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_mean: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    recommendation: Mapped[str] = mapped_column(String(32), default="hold")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MacroSnapshot(Base):
    __tablename__ = "macro_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    series_id: Mapped[str] = mapped_column(String(64), index=True)
    label: Mapped[str] = mapped_column(String(128))
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(32), default="")
    trade_date: Mapped[str] = mapped_column(String(10))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
