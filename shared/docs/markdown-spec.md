# Auto-IEEE Markdown Tagging Spec

## Overview

The Markdown-tagged format lets you prepare a paper **without AI**. The gateway
parses it deterministically into the JSON DocumentModel and sends it to the
engine. Every layout decision must be explicit; nothing is inferred.

---

## Full Example

```markdown
---
title: A Deterministic Typesetting System for IEEE Documents
conference: 2025 IEEE Conference on Compiler Design
abstract: |
  This paper describes a web-based tool that converts researcher drafts into
  submission-ready double-column IEEE documents. The system is purely
  deterministic; AI is optional.
keywords:
  - typesetting
  - IEEE format
  - document automation
page_size: a4
---

:::authors
Alice Smith <alice@university.edu> [1]
Bob Jones [1,2]
Carol White <carol@institute.org> [2]
:::

:::affiliations
1 | Dept. of Computer Science | State University | New York | USA
2 | Research Division | National Institute | Washington | USA
:::

# I. Introduction

First paragraph after a heading receives an indent automatically.

Second paragraph (no indent).

[FIG 1](figure1.png): System architecture showing the three-tier pipeline.

# II. Methodology

[WIDE-FIG 2](pipeline.png): End-to-end processing pipeline spanning both columns.

[TABLE 1]: Comparison of rendering latency across three algorithm variants.
| Algorithm | Latency | Accuracy |
|-----------|---------|----------|
| Variant A | 55 ms   | 91.2%    |
| Variant B | 41 ms   | 95.0%    |

[WIDE-TABLE 2]: Full benchmark results for all configurations.
| Config | A4 Latency | Score |
| A      | 55 ms      | 4.2   |
| B      | 41 ms      | 4.8   |

$$E = mc^2$$ [EQ 1]

$$
\sum_{i=0}^{n} x_i = \frac{n(n+1)}{2}
$$ [EQ 2]

- Bullet item one
- Bullet item two

1. Numbered step one
2. Numbered step two

## A. Subsection Heading

### 1. Sub-subsection Heading

# III. Conclusion

Concluding paragraph.

:::references
- key: "1"
  authors: ["A. Smith", "B. Jones"]
  title: "Automated IEEE Typesetting"
  venue: "IEEE Trans. Document Processing"
  volume: "12"
  issue: "3"
  pages: "101-118"
  year: 2023
  doi: "10.1109/TDP.2023.123456"
:::
```

---

## Spec Reference

### Front Matter (YAML)

The document opens with an optional YAML block delimited by `---`.

| Field        | Type            | Required | Notes                              |
|--------------|-----------------|----------|------------------------------------|
| `title`      | string          | yes      | Paper title                        |
| `conference` | string          | no       | Conference name shown as subtitle  |
| `abstract`   | string          | yes      | Use `|` for multi-line             |
| `keywords`   | list of strings | yes      | Shown as *Index Terms*             |
| `page_size`  | `a4` or `letter`| no       | Default: `a4`                      |

---

### Author Block

```
:::authors
Name <email@optional.com> [affiliation-keys]
:::
```

- Email is optional.
- Affiliation keys are comma-separated integers matching the affiliations block.
- Example: `Alice Smith <alice@uni.edu> [1,2]`

---

### Affiliation Block

```
:::affiliations
key | Department (optional) | Institution | City | Country
:::
```

Pipe-separated fields. The second field is always the institution when there
are fewer than 5 fields; with 5 fields the second is the department.

| Fields | Interpretation                                        |
|--------|-------------------------------------------------------|
| 2      | `key | Institution`                                   |
| 3      | `key | Institution | Country`                         |
| 4      | `key | Institution | City | Country`                  |
| 5      | `key | Department | Institution | City | Country`     |

---

### Headings

```
# [Numbering. ]Heading Text      <- Level 1 (Roman numeral, centered, ALL CAPS)
## [Letter. ]Heading Text        <- Level 2 (letter, left, italic)
### [Number. ]Heading Text       <- Level 3 (number, left, italic)
```

Numbering is **optional**. If omitted, the gateway auto-assigns:
- Level 1: Roman numerals (I, II, III ...)
- Level 2: Letters (A, B, C ... reset on each Level 1)
- Level 3: Arabic numerals (1, 2, 3 ... reset on each Level 2)

---

### Paragraphs

Plain text lines. The **first paragraph after each heading** receives a
first-line indent automatically. Consecutive non-blank lines are joined into
one paragraph.

---

### Figures

Single column:
```
[FIG n](filename.png): Caption text here.
```

Full-width (both columns):
```
[WIDE-FIG n](filename.png): Caption text for wide figure.
```

`filename.png` is the image filename as uploaded via `POST /projects/:id/images`.

---

### Tables

```
[TABLE n]: Caption text here.
| Col 1 | Col 2 | Col 3 |
|-------|-------|-------|   <- separator row (optional, skipped)
| val1  | val2  | val3  |
```

Full-width: `[WIDE-TABLE n]: Caption ...` then pipe rows.

The **first data row** is always the header row. Caption appears above the
table (IEEE convention).

---

### Equations

Single-line:
```
$$\LaTeX expression$$ [EQ n]
```

Multi-line (number on closing line or immediately after):
```
$$
\LaTeX expression
$$ [EQ n]
```

If `[EQ n]` is absent, equations are auto-numbered in order of appearance.

---

### Lists

```
- Bullet item one
- Bullet item two
```

```
1. Numbered step one
2. Numbered step two
```

Consecutive lines of the same type are collected into one list block.

---

### References

Structured YAML list inside a fenced block:

```
:::references
- key: "1"
  authors: ["A. Author", "B. Co-author"]
  title: "Paper Title"
  venue: "Journal or Conference Name"
  year: 2023
  volume: "12"       # optional
  issue: "3"         # optional
  pages: "101-118"   # optional
  doi: "10.xxx/yyy"  # optional
  url: "https://..." # optional
:::
```

---

## Anchor Naming Conventions

| Element     | Anchor format  | Example       |
|-------------|----------------|---------------|
| Figure      | `FIG n`        | `FIG 1`       |
| Wide figure | `WIDE-FIG n`   | `WIDE-FIG 2`  |
| Table       | `TABLE n`      | `TABLE 1`     |
| Wide table  | `WIDE-TABLE n` | `WIDE-TABLE 2`|
| Equation    | `EQ n`         | `EQ 1`        |

Numbering is independent per element type.
