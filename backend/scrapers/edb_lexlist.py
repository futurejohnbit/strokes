from bs4 import BeautifulSoup
from .common import form_search


BASE = "https://www.edbchinese.hk/lexlist_ch/"


def _extract_rows(soup: BeautifulSoup, q: str):
    items = []
    for tr in soup.select("tr"):
        txt = tr.get_text(" ", strip=True)
        if q in txt:
            a = tr.select_one("a")
            link = a.get("href") if a else None
            items.append({"title": txt[:60], "link": link, "snippet": txt})
            if len(items) >= 5:
                break
    if not items:
        for a in soup.select("a"):
            t = a.get_text(" ", strip=True)
            if q in t:
                items.append({"title": t, "link": a.get("href"), "snippet": t})
                if len(items) >= 5:
                    break
    return items


def fetch_edb(q: str):
    sr = form_search(BASE, q)
    soup = sr.get("soup")
    items = _extract_rows(soup, q)
    definition = items[0]["snippet"] if items else None
    return {
        "source_url": sr.get("url") or BASE,
        "definition": definition,
        "pos": None,
        "search_results": items,
    }