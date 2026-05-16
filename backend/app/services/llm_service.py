"""Optional Ollama LLM for narrative insights."""
from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


async def generate_insight(prompt: str) -> str | None:
    settings = get_settings()
    if not settings.enable_llm:
        return None
    url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            res = await client.post(
                url,
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.4, "num_predict": 800},
                },
            )
            res.raise_for_status()
            data = res.json()
            return str(data.get("response", "")).strip() or None
    except Exception as e:
        logger.warning("LLM generate failed: %s", e)
        return None


def build_dashboard_prompt(payload: dict[str, Any]) -> str:
    return f"""你是面向普通投资者的中文证券顾问。根据以下数据，用通俗语言分析（避免术语堆砌），输出**仅一段 JSON**，不要 markdown 代码块：

股票：{payload.get("symbol")}（{payload.get("name")}）
现价：{payload.get("price")}，近30日涨跌：{payload.get("change_pct")}%
综合得分：{payload.get("score")}/100，结论：{payload.get("verdict")}
PE：{payload.get("pe")}，ROE：{payload.get("roe")}%
预测情景：{payload.get("scenarios")}

JSON 格式：
{{
  "summary": "2-3句总述，是否值得投资",
  "trend_human": "人话描述走势与风险",
  "valuation_text": "人话描述贵不贵",
  "composite_advice": "12个月操作建议",
  "ai_points": [
    {{"tag": "看多", "text": "..."}},
    {{"tag": "风险", "text": "..."}},
    {{"tag": "操作", "text": "..."}}
  ]
}}"""


def _extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


async def enrich_dashboard_with_llm(data: dict[str, Any]) -> dict[str, Any]:
    """Merge Ollama JSON into dashboard; fallback to rules on failure."""
    settings = get_settings()
    if not settings.enable_llm:
        data["insight_source"] = data.get("insight_source", "rules")
        return data

    dims = data.get("dimensions") or {}
    prompt = build_dashboard_prompt(
        {
            "symbol": data.get("symbol"),
            "name": data.get("name"),
            "price": data.get("price"),
            "change_pct": data.get("change_pct"),
            "score": data.get("score"),
            "verdict": data.get("verdict"),
            "pe": next((c["value"] for c in data.get("price_cards", []) if "PE" in str(c.get("label", ""))), "—"),
            "roe": dims.get("profit"),
            "scenarios": [
                f"{s.get('name')} {s.get('target_range', '')}" for s in data.get("forecast_scenarios", [])
            ],
        }
    )

    raw = await generate_insight(prompt)
    if not raw:
        data["insight_source"] = "rules"
        data["llm_status"] = "unavailable"
        return data

    parsed = _extract_json(raw)
    if not parsed:
        data["insight_source"] = "rules"
        data["llm_status"] = "parse_failed"
        return data

    if parsed.get("summary"):
        data["summary"] = str(parsed["summary"])[:500]
    if parsed.get("trend_human"):
        data["trend_human"] = str(parsed["trend_human"])[:800]
    if parsed.get("valuation_text"):
        data["valuation_text"] = str(parsed["valuation_text"])[:800]
    if parsed.get("composite_advice"):
        data["composite_advice"] = str(parsed["composite_advice"])[:800]
    if isinstance(parsed.get("ai_points"), list) and parsed["ai_points"]:
        data["ai_points"] = [
            {"tag": str(p.get("tag", "中性")), "text": str(p.get("text", ""))[:200]}
            for p in parsed["ai_points"][:4]
            if isinstance(p, dict)
        ]

    data["insight_source"] = "llm"
    data["llm_status"] = "ok"
    return data
