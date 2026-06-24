from bs4 import BeautifulSoup
from urllib.parse import urljoin
from .common import form_search


BASE = "https://stroke-order.learningweb.moe.edu.tw/searchW.jsp?ID2=1"


def _extract_images(soup: BeautifulSoup, base_url: str, q: str):
    items = []
    for img in soup.select("img"):
        src = img.get("src")
        if not src:
            continue
        alt = img.get("alt") or ""
        if q in alt or "stroke" in src or "gif" in src:
            link = src if src.startswith("http") else urljoin(base_url, src)
            items.append({"title": alt or q, "link": link, "snippet": alt})
            if len(items) >= 5:
                break
    return items


def fetch_stroke(q: str):
    sr = form_search(BASE, q)
    soup = sr.get("soup")
    items = _extract_images(soup, sr.get("url") or BASE, q)
    stroke_image = items[0]["link"] if items else None
    return {
        "source_url": sr.get("url") or BASE,
        "stroke_image": stroke_image,
        "search_results": items,
    }