from typing import Dict, Any, List, Optional
from ..utils.text import to_traditional, normalize_query
from ..utils.pron import pinyin_for, bopomofo_for
from ..scrapers.moe_dict import fetch_moe
from ..scrapers.edb_lexlist import fetch_edb
from ..scrapers.stroke_order import fetch_stroke


class QueryService:
    def __init__(self, repo):
        self.repo = repo

    def query(self, q: str, mode: str = "definition", session_id: Optional[str] = None) -> Dict[str, Any]:
        qn = normalize_query(q)
        qt = to_traditional(qn)  # use traditional for authoritative sources

        moe = fetch_moe(qt)
        edb = fetch_edb(qt)
        stroke = fetch_stroke(qt)

        result: Dict[str, Any] = {
            "query": q,
            "normalized": qn,
            "traditional": qt,
            "mode": mode,
            "sources": {"moe": moe, "edb": edb, "stroke": stroke},
        }

        if mode == "definition":
            result.update(self._merge_definitions(moe, edb))
        elif mode == "pronunciation":
            result.update(self._pronunciation(qt))
        else:
            result["error"] = "未知的查詢模式"

        if session_id:
            self.repo.save_history(session_id, q, result)

        return result

    def _merge_definitions(self, moe: Dict[str, Any], edb: Dict[str, Any]) -> Dict[str, Any]:
        primary = moe.get("definition") or edb.get("definition")
        pos = moe.get("pos") or edb.get("pos")
        confidence = 0.0
        if moe.get("definition"):
            confidence += 0.6
        if edb.get("definition") and edb.get("definition") == moe.get("definition"):
            confidence += 0.3
        approved = confidence >= 0.6
        return {
            "definition": primary,
            "pos": pos,
            "confidence": confidence,
            "approved": approved,
        }

    def _pronunciation(self, qt: str) -> Dict[str, Any]:
        py = pinyin_for(qt)
        zhuyin = bopomofo_for(py)
        return {
            "pinyin": py,
            "zhuyin": zhuyin,
        }