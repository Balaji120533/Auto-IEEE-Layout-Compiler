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

        fig = plt.figure()
        fig.patch.set_alpha(0)
        ax = fig.add_axes([0, 0, 1, 1])
        ax.axis("off")
        ax.patch.set_alpha(0)

        fontsize = 10 if inline else 11
        ax.text(
            0.5, 0.5, expression,
            transform=ax.transAxes,
            fontsize=fontsize,
            ha="center", va="center",
            color="black",
        )

        out_path = self.output_dir / f"eq_{uuid.uuid4().hex[:8]}.png"
        fig.savefig(
            str(out_path),
            dpi=self.DPI,
            bbox_inches="tight",
            transparent=True,
            pad_inches=0.05,
        )
        plt.close(fig)
        return out_path
