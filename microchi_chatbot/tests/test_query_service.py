import types
from backend.services.query_service import QueryService
from backend.repository import Repository


class DummyRepo(Repository):
    def __init__(self):
        super().__init__(None)


def test_merge_definitions(monkeypatch):
    repo = DummyRepo()
    svc = QueryService(repo)

    def fake_moe(q):
        return {"definition": "學習：獲取知識的過程。", "pos": "名詞", "source_url": "moe"}

    def fake_edb(q):
        return {"definition": "學習：獲取知識的過程。", "pos": None, "source_url": "edb"}

    def fake_stroke(q):
        return {"stroke_image": None, "source_url": "stroke"}

    monkeypatch.setattr("backend.services.query_service.fetch_moe", fake_moe)
    monkeypatch.setattr("backend.services.query_service.fetch_edb", fake_edb)
    monkeypatch.setattr("backend.services.query_service.fetch_stroke", fake_stroke)

    out = svc.query("學習", mode="definition", session_id="s1")
    assert out["approved"] is True
    assert out["definition"].startswith("學習")


def test_pronunciation(monkeypatch):
    repo = DummyRepo()
    svc = QueryService(repo)
    out = svc.query("中文", mode="pronunciation", session_id="s1")
    assert "pinyin" in out and isinstance(out["pinyin"], list)
    assert "zhuyin" in out and isinstance(out["zhuyin"], list)