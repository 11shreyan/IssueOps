from difflib import SequenceMatcher

def is_similar(text1: str, text2: str) -> bool:
    ratio = SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    return ratio > 0.7