"""One-off: extract embedded vendor libraries from index.html into vendor/.

Rules enforced by assertions (script aborts before ANY write if violated):
- Blocks are cut VERBATIM (byte-for-byte), never modified.
- Only the 4 block line-ranges change in index.html; everything else identical.
- User's inline code (tailwind.config, custom CSS, main app script) untouched.
"""

import os

SRC = "index.html"
OLD_SIZE = os.path.getsize(SRC)

with open(SRC, "r", encoding="utf-8", newline="") as f:
    text = f.read()

lines = text.split("\n")  # 0-indexed; line N (1-indexed) == lines[N-1]


def L(n):  # 1-indexed line accessor
    return lines[n - 1]


# --- 1) Boundary assertions -------------------------------------------------
expect = {
    10: "<style>",      # Inter font-face block (user's, stays)
    13: "</style>",
    14: "<script>",     # Tailwind Play CDN bundle (to vendor/tailwind.js)
    99: "</script>",
    100: "<script>",    # tailwind.config (user's, stays inline)
    108: "</script>",
    109: "<style>",     # FontAwesome CSS (to vendor/fontawesome.css)
    119: "</style>",
    120: "<script>",    # Chart.js (to vendor/chart.js)
    142: "</script>",
    143: "<script>",    # html2canvas (to vendor/html2canvas.js)
    164: "</script>",
    166: "<style>",     # user custom CSS (stays)
    197: "</style>",
    198: "</head>",
    393: "<script>",    # user main app script (stays)
    2400: "</script>",
    2401: "</body>",
    2402: "</html>",
}
for n, expected in expect.items():
    actual = L(n).strip()
    assert actual == expected, f"line {n}: expected {expected!r}, got {actual!r}"
assert L(101).lstrip().startswith("tailwind.config"), "line 101 is not tailwind.config"
assert L(110).lstrip().startswith("/*!"), "line 110 (FontAwesome CSS) does not start with /*!"
assert L(144).lstrip().startswith("/*!"), "line 144 (html2canvas) does not start with /*!"
assert len(lines) == 2403, f"unexpected line count {len(lines)} (want 2402 + trailing)"
print("boundary assertions: OK")

# --- 2) Library identification sanity (counts only) -------------------------
def count(a, b, needle):
    n = 0
    for i in range(a, b + 1):
        n += L(i).count(needle)
    return n

assert count(14, 99, "tailwind") > 50 and count(14, 99, "Chart") == 0, "block A is not Tailwind"
assert count(109, 119, "Font Awesome") > 0 or count(109, 119, "data:font") > 0, "block D is not FontAwesome"
assert count(120, 142, "Chart") > 0 and count(120, 142, "html2canvas") == 0, "block B is not Chart.js"
assert count(143, 164, "html2canvas") > 0 and count(143, 164, "Chart") == 0, "block C is not html2canvas"
print("library identification: OK (tailwind / fontawesome / chart.js / html2canvas)")

# --- 3) Extract verbatim ----------------------------------------------------
tailwind_css_js = "\n".join(lines[14:98]) + "\n"      # lines 15..98
fontawesome_css = "\n".join(lines[109:118]) + "\n"    # lines 110..118
chart_js = "\n".join(lines[120:141]) + "\n"           # lines 121..141
html2canvas_js = "\n".join(lines[143:163]) + "\n"     # lines 144..163

# FontAwesome font files needed? Every url() must be an embedded data URI.
urls = []
pos = 0
while True:
    pos = fontawesome_css.find("url(", pos)
    if pos == -1:
        break
    urls.append(fontawesome_css[pos:pos + 12])
    pos += 4
external = [u for u in urls if not u.startswith("url(data:")]
assert not external, f"external font urls found: {external[:3]}"
print(f"FontAwesome: {fontawesome_css.count('@font-face')} @font-face rules, "
      f"all {len(urls)} url() refs are embedded data URIs -> no font files needed")

# --- 4) Rebuild index.html: replace 4 ranges, bottom-to-top -----------------
new_lines = list(lines)
new_lines[142:164] = ['<script src="vendor/html2canvas.js"></script>']   # lines 143-164
new_lines[119:142] = ['<script src="vendor/chart.js"></script>']         # lines 120-142
new_lines[108:119] = ['<link rel="stylesheet" href="vendor/fontawesome.css">']  # lines 109-119
new_lines[13:99] = ['<script src="vendor/tailwind.js"></script>']        # lines 14-99

new_text = "\n".join(new_lines)

# --- 5) Verify everything outside the 4 ranges is byte-identical ------------
skip_old = [(14, 99), (109, 119), (120, 142), (143, 164)]
i = j = 0
while i < len(lines):
    ln = i + 1
    block = next(((a, b) for a, b in skip_old if a <= ln <= b), None)
    if block:
        i = block[1]   # jump past the block; next iteration starts at b+1
        j += 1         # block was replaced by exactly one reference line
    else:
        assert lines[i] == new_lines[j], f"mismatch at old line {ln}!"
        i += 1
        j += 1
assert j == len(new_lines), f"new file has {len(new_lines)} lines, walked {j}"
print("outside-block byte-identity: OK (all other lines unchanged)")

# --- 6) Belt-and-suspenders: user code survived (by content counts) ---------
for needle in ("tailwind.config", "onayKapat", "localStorage", "scroll-behavior: smooth", "@font-face"):
    before, after = text.count(needle), new_text.count(needle)
    assert before == after, f"{needle!r}: {before} -> {after}"

# --- 7) Write outputs -------------------------------------------------------
os.makedirs("vendor", exist_ok=True)
with open("index.html", "w", encoding="utf-8", newline="") as f:
    f.write(new_text)
with open("vendor/tailwind.js", "w", encoding="utf-8", newline="") as f:
    f.write(tailwind_css_js)
with open("vendor/fontawesome.css", "w", encoding="utf-8", newline="") as f:
    f.write(fontawesome_css)
with open("vendor/chart.js", "w", encoding="utf-8", newline="") as f:
    f.write(chart_js)
with open("vendor/html2canvas.js", "w", encoding="utf-8", newline="") as f:
    f.write(html2canvas_js)

# --- 8) Read-back verification ----------------------------------------------
with open(SRC, "r", encoding="utf-8", newline="") as f:
    check_lines = f.read().split("\n")
assert len(check_lines) == 2288, f"read-back line elements: {len(check_lines)} (want 2288)"
assert check_lines[13] == '<script src="vendor/tailwind.js"></script>'
assert check_lines[23] == '<link rel="stylesheet" href="vendor/fontawesome.css">'
assert check_lines[47] == '<script src="vendor/chart.js"></script>'
assert check_lines[48] == '<script src="vendor/html2canvas.js"></script>'
assert check_lines[:13] == lines[:13], "head region changed!"
assert check_lines[49:] == lines[164:], "tail region changed!"
assert check_lines[-2] == "</html>"
print("read-back verification: OK")

print(f"\nindex.html: {OLD_SIZE:,} -> {os.path.getsize(SRC):,} bytes")
for name in ("tailwind.js", "fontawesome.css", "chart.js", "html2canvas.js"):
    print(f"vendor/{name}: {os.path.getsize(os.path.join('vendor', name)):,} bytes")
print("DONE")
