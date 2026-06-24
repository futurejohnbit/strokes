import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
}


def _first_form(soup):
    forms = soup.find_all("form")
    return forms[0] if forms else None


def _guess_query_name(form):
    names = []
    for inp in form.find_all("input"):
        t = (inp.get("type") or "").lower()
        n = inp.get("name")
        if t in ("text", "search") and n:
            names.append(n)
    for cand in ("q", "keyword", "key", "wd", "word", "term", "search"):
        return cand if cand in names else (names[0] if names else None)


def form_search(base_url: str, term: str, timeout: int = 6):
    try:
        r0 = requests.get(base_url, headers=UA, timeout=timeout)
        r0.raise_for_status()
        soup0 = BeautifulSoup(r0.text, "html.parser")
        form = _first_form(soup0)
        if form:
            action = form.get("action") or base_url
            method = (form.get("method") or "get").lower()
            qname = _guess_query_name(form)
            if qname:
                url = urljoin(r0.url, action)
                if method == "post":
                    r = requests.post(url, headers=UA, data={qname: term}, timeout=timeout)
                else:
                    r = requests.get(url, headers=UA, params={qname: term}, timeout=timeout)
                r.raise_for_status()
                return {"url": r.url, "soup": BeautifulSoup(r.text, "html.parser"), "html": r.text}
        # fallback: try common query key
        r = requests.get(base_url, headers=UA, params={"q": term}, timeout=timeout)
        r.raise_for_status()
        return {"url": r.url, "soup": BeautifulSoup(r.text, "html.parser"), "html": r.text}
    except Exception as e:
        return {"url": base_url, "soup": BeautifulSoup("", "html.parser"), "html": ""}