import requests
from bs4 import BeautifulSoup


BASE = "https://www.edbchinese.hk/lexlist_ch/"


def fetch_edb(q: str):
    # The site may not expose search easily; provide minimal reference
    try:
        resp = requests.get(BASE, timeout=5)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        # Try to find a table row that contains the query
        row = None
        for tr in soup.select("tr"):
            if q in tr.get_text():
                row = tr
                break
        definition = None
        if row:
            definition = row.get_text(" ", strip=True)
        return {"source_url": BASE, "definition": definition, "pos": None}
    except Exception:
        return {"source_url": BASE, "definition": None, "pos": None}