import re
import json
from pathlib import Path
from urllib.parse import unquote

html = Path(__file__).with_name("embed.html").read_text(encoding="utf-8", errors="ignore")

# Slide copy is stored as JSON-like arrays: ["Line\\n","Line\\n"]
raw_lines = re.findall(r'\["((?:\\.|[^"\\])*)\\n"', html)
print("=== RAW LINES ===")
for i, line in enumerate(raw_lines):
    clean = line.encode("utf-8").decode("unicode_escape")
    print(f"{i:03d}: {clean}")

print("\n=== LONGER TEXT BLOBS ===")
blobs = re.findall(r'"((?:\\.|[^"\\]){12,220})"', html)
skip = (
    "http", "canva", "function", "https", "thumbnail", "document",
    "AAAA", "H4sI", "font", "rgba", "width", "height", "nonce",
)
seen = set()
for b in blobs:
    low = b.lower()
    if any(s in low for s in skip):
        continue
    if b.startswith("{") or b.startswith("[") or "\\" in b[:3]:
        continue
    if b in seen:
        continue
    seen.add(b)
    print(b)

print("\n=== MEDIA URLS ===")
urls = re.findall(r'https://media\.canva\.com/v2/document-image[^"\\]+', html)
print(f"found {len(urls)} document images")
for u in urls[:20]:
    print(u[:180])

print("\n=== PUBLIC MEDIA ===")
pub = sorted(set(re.findall(r'https://media-public\.canva\.com/[^"\\]+', html)))
for u in pub[:40]:
    print(u)
