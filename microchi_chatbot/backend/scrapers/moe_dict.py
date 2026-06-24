import requests
from bs4 import BeautifulSoup


BASE = "https://dict.revised.moe.edu.tw/search.jsp?la=0&powerMode=0"


def fetch_moe(q: str):
    try:
        resp = requests.get(BASE, params={"q": q}, timeout=5)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        definition = None
        pos = None
        # Try typical selectors
        for sel in [".result_content", ".entry .def", "#search_content"]:
            node = soup.select_one(sel)
            if node:
                txt = node.get_text(" ", strip=True)
                if txt:
                    definition = txt
                    break
        # POS hints
        pos_node = soup.find(lambda tag: tag.name in ("span","div") and ("詞性" in tag.get_text() or "詞類" in tag.get_text()))
        if pos_node:
            pos = pos_node.get_text(" ", strip=True)
        return {"source_url": resp.url, "definition": definition, "pos": pos}
    except Exception:
        return {"source_url": BASE, "definition": None, "pos": None}