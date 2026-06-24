import re

try:
    from opencc import OpenCC
    _cc = OpenCC('s2t')
except Exception:
    _cc = None


_simple_to_trad_map = {
    "汉": "漢",
    "语": "語",
    "学": "學",
    "习": "習",
    "里": "裡",
}


def normalize_query(q: str) -> str:
    q = q.strip()
    q = re.sub(r"\s+", " ", q)
    return q


def to_traditional(q: str) -> str:
    if _cc:
        try:
            return _cc.convert(q)
        except Exception:
            pass
    return ''.join(_simple_to_trad_map.get(ch, ch) for ch in q)