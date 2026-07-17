"""Math backend v1: matplotlib mathtext → 300 DPI transparent PNG."""
from __future__ import annotations

import uuid
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


class MatplotlibMathBackend:
    """
    Renders LaTeX-like math via matplotlib's mathtext engine.
    Does not require a TeX installation.
    """

    DPI = 300

    def __init__(self, output_dir: Path) -> None:
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def render(self, latex: str, inline: bool = False) -> Path:
        """Render `latex` to a transparent PNG and return its path."""
        expression = latex.strip()
        if not expression.startswith("$"):
            expression = f"${expression}$"

        # Display equations render a bit larger so they read clearly in the
        # two-column layout; inline stays close to body text size.
        fontsize = 10 if inline else 13

        # Draw the expression as a figure-level text artist (NOT inside an
        # axes that fills the whole canvas — that stopped bbox_inches="tight"
        # from cropping, leaving the glyph as a tiny mark on a large canvas,
        # which then got clamped to column width and looked shrunken). Start
        # from a tiny figure and let tight bbox grow it to exactly the text.
        fig = plt.figure(figsize=(0.01, 0.01))
        fig.patch.set_alpha(0)
        fig.text(0, 0, expression, fontsize=fontsize, color="black")

        out_path = self.output_dir / f"eq_{uuid.uuid4().hex[:8]}.png"
        fig.savefig(
            str(out_path),
            dpi=self.DPI,
            bbox_inches="tight",
            transparent=True,
            pad_inches=0.02,
        )
        plt.close(fig)
        return out_path
