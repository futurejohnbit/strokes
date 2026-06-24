from bs4 import BeautifulSoup
import requests
import re
from urllib.parse import urljoin
from .common import form_search
try:
    from playwright.sync_api import sync_playwright
except Exception:
    sync_playwright = None


BASE = "https://dict.revised.moe.edu.tw/search.jsp?la=0&powerMode=0"


def _extract_list(soup: BeautifulSoup, q: str):
    items = []
    for a in soup.select("a"):
        t = a.get_text(" ", strip=True)
        if not t:
            continue
        if q in t:
            href = a.get("href")
            items.append({"title": t, "link": href, "snippet": t})
            if len(items) >= 5:
                break
    return items


def _resolve_content_soup(soup: BeautifulSoup, base_url: str) -> BeautifulSoup:
    iframe = soup.select_one("iframe[src]")
    if iframe and iframe.get("src"):
        try:
            src = iframe.get("src")
            url = src if src.startswith("http") else urljoin(base_url, src)
            r = requests.get(url, timeout=6)
            r.raise_for_status()
            return BeautifulSoup(r.text, "html.parser")
        except Exception:
            return soup
    return soup


def _extract_def_sections(soup: BeautifulSoup):
    sections = {}
    # common part-of-speech labels seen on MOE: 名、動、形、副、介、連、助、嘆
    labels = ["名", "動", "形", "副", "介", "連", "助", "嘆"]
    for lab in labels:
        # find a block that contains the label as a separate text
        node = soup.find(lambda tag: tag.name in ("span","div","h3") and tag.get_text(strip=True) == lab)
        items = []
        if node:
            # collect nearby li items
            ul = node.find_next("ul")
            if ul:
                for li in ul.find_all("li"):
                    txt = li.get_text(" ", strip=True)
                    if txt:
                        items.append(txt)
            else:
                # fallback: scan next siblings for paragraphs
                sib = node.find_next()
                cnt = 0
                while sib and cnt < 10:
                    if sib.name in ("p","li"):
                        t = sib.get_text(" ", strip=True)
                        if t:
                            items.append(t)
                    sib = sib.find_next_sibling()
                    cnt += 1
        if items:
            sections[lab] = items
    return sections


def _format_sections(sections: dict):
    out = {}
    for lab, items in (sections or {}).items():
        arr = []
        for it in items:
            txt = it.strip()
            ex = []
            import re
            ex += re.findall(r"《([^》]+)》", txt)
            ex += re.findall(r"「([^」]+)」", txt)
            gloss = re.sub(r"《[^》]+》|「[^」]+」", "", txt)
            parts = [p for p in re.split(r"[。；]", gloss) if p]
            if parts:
                gloss = parts[0]
                ex += parts[1:]
            arr.append({"gloss": gloss, "examples": ex})
        out[lab] = arr
    return out


def _fetch_detail(soup: BeautifulSoup, base_url: str):
    a = (
        soup.select_one("a[href*='dictView.jsp']")
        or soup.select_one("a[href*='opendetail']")
        or soup.select_one("a[href*='detail']")
        or soup.select_one("a[href*='ID=']")
        or soup.select_one("a[href*='id=']")
    )
    if not a:
        return None, None, None, None, base_url
    href = a.get("href")
    abs_url = urljoin(base_url, href) if href else base_url
    try:
        r = requests.get(abs_url, timeout=6)
        r.raise_for_status()
        s0 = BeautifulSoup(r.text, "html.parser")
        s = _resolve_content_soup(s0, abs_url)
        d = _extract_definition(s) or None
        if not d:
            node = s.select_one(".result_content") or s.select_one(".con") or s.select_one(".content")
            d = node.get_text(" ", strip=True) if node else None
        pos_node = s.find(lambda tag: tag.name in ("span","div") and ("詞性" in tag.get_text() or "詞類" in tag.get_text()))
        pos = pos_node.get_text(" ", strip=True) if pos_node else None
        zhuyin_list, pinyin_list = _extract_pron(s)
        # if not found, try whole page text
        if not zhuyin_list or not pinyin_list:
            full_txt = s.get_text(" ", strip=True)
            zhuyin_list = zhuyin_list or _BPM_RE.findall(full_txt)
            tmp_py = _PINYIN_RE.findall(full_txt)
            pinyin_list = pinyin_list or [p for p in tmp_py if any(ch.isdigit() for ch in p)]
        sections = _extract_def_sections(s)
        sections_fmt = _format_sections(sections)
        # try explicit pinyin label extraction
        if not pinyin_list:
            pinyin_list = _extract_pinyin_label(s)
        if not d and sync_playwright:
            # render with Playwright to fetch dynamic content
            try:
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    context = browser.new_context()
                    page = context.new_page()
                    page.goto(abs_url, wait_until='domcontentloaded')
                    # the content may be inside an iframe
                    frames = page.frames
                    target = page
                    if len(frames) > 1:
                        target = frames[-1]
                    # try select sections
                    # try toggling to 漢語拼音 view if available
                    try:
                        target.click("text=漢語拼音", timeout=1000)
                    except Exception:
                        pass
                    html = target.content()
                    s_dyn = BeautifulSoup(html, 'html.parser')
                    d = _extract_definition(s_dyn) or d
                    sections = _extract_def_sections(s_dyn) or sections
                    if not pinyin_list:
                        pinyin_list = _extract_pinyin_label(s_dyn)
                    browser.close()
            except Exception:
                pass
        return d, pos, zhuyin_list, pinyin_list, abs_url, sections_fmt
    except Exception:
        return None, None, None, None, abs_url, {}


_BPM_RE = re.compile(r"[\u3105-\u3129\u02D9\u02C7\u02CA\u02CB]+")
_PINYIN_RE = re.compile(r"[A-Za-z]+[1-5]?[A-Za-z]*")
_PINYIN_DIA_RE = re.compile(r"[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+")


def _extract_pron(soup: BeautifulSoup):
    zhuyin_list = []
    pinyin_list = []
    # label-based extraction from table rows
    for tr in soup.select("tr"):
        cells = tr.find_all(["th","td"]) or []
        if not cells:
            continue
        header = cells[0].get_text(" ", strip=True)
        if "注音" in header or "音讀" in header:
            for td in cells[1:]:
                txt = td.get_text(" ", strip=True)
                bpm = _BPM_RE.findall(txt)
                if bpm:
                    zhuyin_list.extend(bpm)
        if "漢語拼音" in header:
            for td in cells[1:]:
                txt = td.get_text(" ", strip=True)
                di = _PINYIN_DIA_RE.findall(txt)
                if di:
                    pinyin_list.extend(di)
    # scan table rows
    for tr in soup.select("tr"):
        txt = tr.get_text(" ", strip=True)
        if not txt:
            continue
        # collect zhuyin sequences
        bpm = _BPM_RE.findall(txt)
        if bpm:
            zhuyin_list.extend(bpm)
        # collect pinyin sequences (tone number format or diacritics handled loosely)
        py_num = _PINYIN_RE.findall(txt)
        py_dia = _PINYIN_DIA_RE.findall(txt)
        if py_num:
            py_num = [p for p in py_num if len(p) > 1 and any(ch.isdigit() for ch in p)]
            pinyin_list.extend(py_num)
        if py_dia:
            # keep diacritic pinyin; filter out common noise words
            noise = {"JavaScript","EN","VoIP","TANet"}
            py_dia = [p for p in py_dia if p not in noise]
            pinyin_list.extend(py_dia)
    # also scan anchors
    for a in soup.select("a"):
        t = a.get_text(" ", strip=True)
        if not t:
            continue
        bpm = _BPM_RE.findall(t)
        if bpm:
            zhuyin_list.extend(bpm)
        di = _PINYIN_DIA_RE.findall(t)
        if di:
            noise = {"JavaScript","EN","VoIP","TANet"}
            di = [p for p in di if p not in noise]
            pinyin_list.extend(di)
    # dedupe, keep order
    def _dedupe(seq):
        out, seen = [], set()
        for x in seq:
            if x not in seen:
                out.append(x)
                seen.add(x)
        return out
    return _dedupe(zhuyin_list), _dedupe(pinyin_list)


def _extract_pinyin_label(soup: BeautifulSoup):
    out = []
    # direct label nodes
    for tag in soup.find_all(["span","div","td","th","h3","h2"]):
        txt = tag.get_text(" ", strip=True)
        if not txt:
            continue
        if "漢語拼音" in txt:
            # next non-empty text around
            # check next siblings
            for sib in tag.find_all_next(["span","div","td","p"], limit=6):
                t = sib.get_text(" ", strip=True)
                di = _PINYIN_DIA_RE.findall(t)
                if di:
                    out.extend([p for p in di if p])
                    break
    return out


def _table_value(soup: BeautifulSoup, header_candidates):
    for tr in soup.select("tr"):
        th = tr.find(["th", "td"])  # header cell
        if not th:
            continue
        htxt = th.get_text(" ", strip=True)
        if any(h in htxt for h in header_candidates):
            cells = tr.find_all("td")
            for td in cells:
                txt = td.get_text(" ", strip=True)
                if txt:
                    return txt
    return None


def _extract_definition(soup: BeautifulSoup):
    val = _table_value(soup, ["釋義", "義", "解釋"])
    if val:
        return val
    # Meta description fallback
    meta = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
    if meta and meta.get("content"):
        cnt = meta.get("content").strip()
        if cnt:
            return cnt
    for tag in soup.find_all(["h1","h2","h3","dt","span","div"]):
        t = tag.get_text(" ", strip=True)
        if not t:
            continue
        if "釋義" in t or "解釋" in t:
            block = []
            for sib in tag.find_all_next(["p","li","dd","div"], limit=8):
                txt = sib.get_text(" ", strip=True)
                if not txt:
                    continue
                if any(stop in txt for stop in ["字詞", "音讀", "注音", "漢語拼音", "系統選單", "最新消息"]):
                    break
                block.append(txt)
                if len(" ".join(block)) >= 600:
                    break
            if block:
                return " ".join(block)
    # Fallback: find keyword in full text and slice
    full = soup.get_text(" ", strip=True)
    for kw in ("釋義", "解釋"):
        idx = full.find(kw)
        if idx != -1:
            tail = full[idx+len(kw):]
            # stop at common next section markers
            for stop in ("字詞", "音讀", "注音", "漢語拼音", "系統選單", "最新消息"):
                sidx = tail.find(stop)
                if sidx != -1:
                    tail = tail[:sidx]
            return tail.strip()[:600]
    return None


def fetch_moe(q: str):
    sr = form_search(BASE, q)
    soup = sr.get("soup")
    items = _extract_list(soup, q)
    # normalize item links to absolute
    for it in items:
        if it.get("link") and not str(it["link"]).startswith("http"):
            it["link"] = urljoin(sr.get("url") or BASE, it["link"]) 
    definition, pos, zhuyin_list, pinyin_list, detail_url, sections = _fetch_detail(soup, sr.get("url"))
    detail_items = []
    for it in items[:3]:
        link = it.get("link")
        if not link:
            continue
        try:
            r = requests.get(link, timeout=6)
            r.raise_for_status()
            s0 = BeautifulSoup(r.text, "html.parser")
            s = _resolve_content_soup(s0, link)
            d = _extract_definition(s) or None
            if not d:
                node = s.select_one(".result_content") or s.select_one(".con") or s.select_one(".content")
                d = node.get_text(" ", strip=True) if node else None
            pos_node = s.find(lambda tag: tag.name in ("span","div") and ("詞性" in tag.get_text() or "詞類" in tag.get_text()))
            p = pos_node.get_text(" ", strip=True) if pos_node else None
            zlist, plist = _extract_pron(s)
            if not plist:
                plist = _extract_pinyin_label(s)
            if not zlist or not plist:
                full_txt = s.get_text(" ", strip=True)
                zlist = zlist or _BPM_RE.findall(full_txt)
                tmp_py2 = _PINYIN_RE.findall(full_txt)
                plist = plist or [p for p in tmp_py2 if any(ch.isdigit() for ch in p)]
            detail_items.append({"title": it.get("title"), "link": link, "definition": d, "pos": p, "zhuyin_list": zlist, "pinyin_list": plist, "sections": _format_sections(_extract_def_sections(s))})
        except Exception:
            detail_items.append({"title": it.get("title"), "link": link, "definition": None, "pos": None, "zhuyin_list": None, "pinyin_list": None, "sections": {}})
    return {
        "source_url": sr.get("url") or BASE,
        "search_page_url": sr.get("url") or BASE,
        "detail_url": detail_url,
        "definition": definition,
        "pos": pos,
        "zhuyin_list": zhuyin_list,
        "pinyin_list": pinyin_list,
        "sections": sections,
        "search_results": items,
        "detail_items": detail_items,
    }