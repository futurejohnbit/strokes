import os
import time
import uuid
from typing import Any, Dict, List, Optional

try:
    from pymongo import MongoClient, ASCENDING
except Exception:
    MongoClient = None


class Repository:
    def __init__(self, mongo_uri: Optional[str] = None):
        self._memory: Dict[str, Dict[str, Any]] = {}
        self._mongo_uri = mongo_uri
        self._client = None
        self._db = None
        if mongo_uri and MongoClient:
            self._client = MongoClient(mongo_uri)
            self._db = self._client.get_database()
            self._db.history.create_index([("session_id", ASCENDING), ("ts", ASCENDING)])
            self._db.favorites.create_index([("session_id", ASCENDING)])

    def ensure_session(self) -> str:
        sid = uuid.uuid4().hex
        self._memory.setdefault(sid, {"history": [], "favorites": []})
        return sid

    def save_history(self, session_id: str, q: str, result: Dict[str, Any]):
        item = {"session_id": session_id, "q": q, "result": result, "ts": time.time()}
        if self._db:
            self._db.history.insert_one(item)
        else:
            mem = self._memory.setdefault(session_id, {"history": [], "favorites": []})
            mem["history"].append(item)

    def get_history(self, session_id: Optional[str]) -> List[Dict[str, Any]]:
        if not session_id:
            return []
        if self._db:
            cur = self._db.history.find({"session_id": session_id}).sort("ts", ASCENDING)
            return [{"q": d.get("q"), "result": d.get("result"), "ts": d.get("ts")} for d in cur]
        mem = self._memory.get(session_id, {"history": []})
        return mem.get("history", [])

    def add_favorite(self, session_id: Optional[str], item: Dict[str, Any]) -> bool:
        if not session_id or not item:
            return False
        if self._db:
            self._db.favorites.update_one({"session_id": session_id, "key": item.get("key")}, {"$set": {**item, "session_id": session_id}}, upsert=True)
            return True
        mem = self._memory.setdefault(session_id, {"history": [], "favorites": []})
        key = item.get("key")
        mem["favorites"] = [f for f in mem["favorites"] if f.get("key") != key] + [item]
        return True

    def remove_favorite(self, session_id: Optional[str], item: Dict[str, Any]) -> bool:
        if not session_id or not item:
            return False
        if self._db:
            self._db.favorites.delete_one({"session_id": session_id, "key": item.get("key")})
            return True
        mem = self._memory.setdefault(session_id, {"history": [], "favorites": []})
        key = item.get("key")
        mem["favorites"] = [f for f in mem["favorites"] if f.get("key") != key]
        return True

    def get_favorites(self, session_id: Optional[str]) -> List[Dict[str, Any]]:
        if not session_id:
            return []
        if self._db:
            cur = self._db.favorites.find({"session_id": session_id})
            return [{k: v for k, v in d.items() if k not in ("_id", "session_id")} for d in cur]
        mem = self._memory.get(session_id, {"favorites": []})
        return mem.get("favorites", [])