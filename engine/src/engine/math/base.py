"""Pluggable math-rendering interface. Drop in v2 (KaTeX→PNG) or v3 (OMML) later."""
from __future__ import annotations

from pathlib import Path
from typing import Protocol, runtime_checkable


@runtime_checkable
class MathBackend(Protocol):
    """Render a LaTeX expression and return the path to a PNG file."""

    def render(self, latex: str, inline: bool = False) -> Path:
        """
        Args:
            latex: LaTeX source, e.g. r'\frac{a}{b}' (no surrounding $).
            inline: True for inline equations, False for display equations.
        Returns:
            Path to the rendered transparent PNG (300 DPI).
        """
        ...
