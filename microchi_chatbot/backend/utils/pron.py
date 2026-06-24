from typing import List

try:
    from pypinyin import lazy_pinyin, Style
except Exception:
    lazy_pinyin = None
    Style = None


_py_map = {
    # minimal fallback mapping for common syllables
    'zhong': 'ㄓㄨㄥ',
    'guo': 'ㄍㄨㄛ',
    'han': 'ㄏㄢ',
}

_bpm_map = {
    'a': 'ㄚ','o': 'ㄛ','e': 'ㄜ','i': 'ㄧ','u': 'ㄨ','v': 'ㄩ',
    'b':'ㄅ','p':'ㄆ','m':'ㄇ','f':'ㄈ','d':'ㄉ','t':'ㄊ','n':'ㄋ','l':'ㄌ',
    'g':'ㄍ','k':'ㄎ','h':'ㄏ','j':'ㄐ','q':'ㄑ','x':'ㄒ','zh':'ㄓ','ch':'ㄔ','sh':'ㄕ','r':'ㄖ','z':'ㄗ','c':'ㄘ','s':'ㄙ','y':'ㄧ','w':'ㄨ'
}


def pinyin_for(text: str) -> List[str]:
    if lazy_pinyin:
        try:
            return lazy_pinyin(text, style=Style.TONE3)
        except Exception:
            pass
    # naive fallback: return letters or mapped syllables
    return [_fallback_pinyin(ch) for ch in text]


def _fallback_pinyin(ch: str) -> str:
    return ch


def bopomofo_for(pinyin_list: List[str]) -> List[str]:
    out = []
    for py in pinyin_list:
        out.append(_py_to_bpm(py))
    return out


def _py_to_bpm(py: str) -> str:
    tone = ''
    if py and py[-1].isdigit():
        tone = py[-1]
        py = py[:-1]
    # try mapping initial+final
    bpm = ''
    # handle zh/ch/sh first
    for init in ('zh','ch','sh'):
        if py.startswith(init):
            bpm += _bpm_map.get(init, '')
            py = py[len(init):]
            break
    # single initials
    if py and py[0] in _bpm_map:
        bpm += _bpm_map.get(py[0], '')
        py = py[1:]
    # finals
    for ch in py:
        bpm += _bpm_map.get(ch, '')
    return bpm + (tone or '')