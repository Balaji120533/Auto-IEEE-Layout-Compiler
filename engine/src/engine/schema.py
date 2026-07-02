"""
DocumentModel — copy of shared/schema/document_model.py.
Changes here MUST be reflected in /shared/schema/document_model.py (and vice-versa).
"""
from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

SCHEMA_VERSION = "1.0"


class Author(BaseModel):
    name: str
    affiliation_refs: list[str]
    email: str | None = None


class Affiliation(BaseModel):
    key: str
    institution: str
    department: str | None = None
    city: str | None = None
    country: str | None = None


class Reference(BaseModel):
    key: str
    authors: list[str]
    title: str
    venue: str | None = None
    year: int
    volume: str | None = None
    issue: str | None = None
    pages: str | None = None
    doi: str | None = None
    url: str | None = None


class ParagraphBlock(BaseModel):
    type: Literal["paragraph"]
    text: str
    indent: bool = True


class HeadingBlock(BaseModel):
    type: Literal["heading"]
    level: Literal[1, 2, 3]
    text: str
    numbering: str | None = None


class FigureBlock(BaseModel):
    type: Literal["figure", "wide_figure"]
    anchor: str
    image_ref: str
    caption: str


class TableBlock(BaseModel):
    type: Literal["table", "wide_table"]
    anchor: str
    caption: str
    rows: list[list[str]]
    header_row: bool = True


class EquationBlock(BaseModel):
    type: Literal["equation"]
    anchor: str
    latex: str
    inline: bool = False


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


class CompileOptions(BaseModel):
    math_backend: Literal["matplotlib", "katex", "omml"] = "matplotlib"
    page_size: Literal["letter", "a4"] = "a4"
    column_sep_pt: float | None = None


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
    compile_options: CompileOptions = Field(default_factory=CompileOptions)
