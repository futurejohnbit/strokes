import requests
from bs4 import BeautifulSoup


BASE = "https://stroke-order.learningweb.moe.edu.tw/searchW.jsp?ID2=1"


def fetch_stroke(q: str):
    try:
        resp = requests.get(BASE, params={"q": q}, timeout=5)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        img = soup.select_one("img[src*='stroke']") or soup.select_one("img")
        img_url = None
        if img and img.get("src"):
            src = img.get("src")
            if src.startswith("http"):
                img_url = src
            else:
                from urllib.parse import urljoin
                img_url = urljoin(resp.url, src)
        return {"source_url": resp.url, "stroke_image": img_url}
    except Exception:
        return {"source_url": BASE, "stroke_image": None}