"""
Style name constants matching the IEEE template (conference-template-a4.docx).
Verified by inspecting the patched template with python-docx.
"""

# Header
PAPER_TITLE   = "paper title"    # 24pt
PAPER_SUBTITLE = "paper subtitle" # 14pt
AUTHOR        = "Author"          # 11pt
AFFILIATION   = "Affiliation"     # 9pt (estimated)
ABSTRACT      = "Abstract"        # 9pt
KEYWORDS      = "Keywords"

# Body
BODY_TEXT     = "Body Text"
HEADING_1     = "Heading 1"
HEADING_2     = "Heading 2"
HEADING_3     = "Heading 3"
BULLET_LIST   = "bullet list"
EQUATION      = "equation"

# Figures / tables
FIGURE_CAPTION = "figure caption"  # 8pt
TABLE_HEAD     = "table head"       # 8pt bold
TABLE_COL_HEAD = "table col head"   # 8pt bold
TABLE_COPY     = "table copy"       # 8pt

# References
REFERENCES    = "references"        # 8pt

# Page geometry (from template, in pt notation — must match template XML)
PAGE_W_PT     = "595.30pt"
PAGE_H_PT     = "841.90pt"
PAGE_CODE     = "9"
MARGIN_TOP    = "54pt"
MARGIN_RIGHT  = "45.35pt"
MARGIN_BOTTOM = "72pt"
MARGIN_LEFT   = "45.35pt"
MARGIN_HEADER = "36pt"
MARGIN_FOOTER = "36pt"
MARGIN_GUTTER = "0pt"
DOC_GRID_PITCH = "360"

# Column gutter (body 2-col section)
COL_SPACE_2   = "18pt"
COL_SPACE_1   = "36pt"

# Computed widths in inches for image scaling
COL_WIDTH_IN  = 3.38   # single column
FULL_WIDTH_IN = 7.01   # full text area (two columns + gutter)

# Usable page height (A4 841.90pt - 54pt top margin - 72pt bottom margin) / 72 ≈ 9.94in.
# Figures are capped well below that so captions/surrounding text still fit on the page.
MAX_FIGURE_HEIGHT_IN = 6.0
