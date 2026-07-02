"""
Gateway → Engine data contract.

This file is the Pydantic mirror of document_model.ts.
Any change here MUST be reflected in document_model.ts.
Both are validated against document_model.schema.json in CI.
"""

from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

SCHEMA_VERSION = "1.0"

# ── Metadata ──────────────────────────────────────────────────────────────────


class Author(BaseModel):
    name: str
    affiliation_refs: list[str]
    email: str | None = None


class Affiliation(BaseModel):
    key: str                    # matched by Author.affiliation_refs
    institution: str
    department: str | None = None
    city: str | None = None
    country: str | None = None


class Reference(BaseModel):
    key: str                    # citation label, e.g. "1"
    authors: list[str]
    title: str
    venue: str | None = None    # journal or conference name
    year: int
    volume: str | None = None
    issue: str | None = None
    pages: str | None = None    # e.g. "123–130"
    doi: str | None = None
    url: str | None = None


# ── Block types ───────────────────────────────────────────────────────────────


class ParagraphBlock(BaseModel):
    type: Literal["paragraph"]
    text: str                   # may contain inline [EQ n] refs
    indent: bool


class HeadingBlock(BaseModel):
    type: Literal["heading"]
    level: Literal[1, 2, 3]
    text: str
    numbering: str | None = None   # resolved by gateway, e.g. "II.A"


class FigureBlock(BaseModel):
    type: Literal["figure", "wide_figure"]
    anchor: str                 # e.g. "FIG 1"
    image_ref: str              # path relative to gateway/storage/
    caption: str


class TableBlock(BaseModel):
    type: Literal["table", "wide_table"]
    anchor: str                 # e.g. "TABLE 1"
    caption: str
    rows: list[list[str]]       # rows[row][col] — plain cell text
    header_row: bool


class EquationBlock(BaseModel):
    type: Literal["equation"]
    anchor: str                 # e.g. "EQ 1"
    latex: str                  # passed verbatim to the math backend
    inline: bool


class ListBlock(BaseModel):
    type: Literal["list"]
    style: Literal["bullet", "numbered"]
    items: list[str]


Block = Annotated[
    Union[
        ParagraphBlock,
        HeadingBlock,
        FigureBlock,
        TableBlock,
        EquationBlock,
        ListBlock,
    ],
    Field(discriminator="type"),
]


# ── Compile options ───────────────────────────────────────────────────────────


class CompileOptions(BaseModel):
    math_backend: Literal["matplotlib", "katex", "omml"] = "matplotlib"
    page_size: Literal["letter", "a4"] = "a4"
    column_sep_pt: float | None = None  # defaults to IEEE spec value


# ── Root ──────────────────────────────────────────────────────────────────────


class DocumentMetadata(BaseModel):
    title: str
    authors: list[Author]
    affiliations: list[Affiliation]
    abstract: str
    keywords: list[str]
    conference: str | None = None


class DocumentModel(BaseModel):
    schema_version: Literal["1.0"]
    metadata: DocumentMetadata
    blocks: list[Block]
    references: list[Reference] | None = None
    compile_options: CompileOptions
