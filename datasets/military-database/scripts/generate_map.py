#!/usr/bin/env python3
"""Generate an interactive HTML map of all military bases using folium.

Usage:
    python3 scripts/generate_map.py [--output map.html]

Requires: pip install folium
If folium is not available, falls back to a static matplotlib PNG.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASES_DIR = ROOT / "bases"

COUNTRY_COLORS = {
    "US": "blue",
    "JP": "darkblue",
    "KR": "cadetblue",
    "TW": "green",
    "PH": "lightgreen",
    "AU": "purple",
    "CN": "red",
    "KP": "darkred",
}

COUNTRY_LABELS = {
    "US": "United States",
    "JP": "Japan",
    "KR": "South Korea",
    "TW": "Taiwan",
    "PH": "Philippines",
    "AU": "Australia",
    "CN": "China (PLA)",
    "KP": "North Korea",
}

BRANCH_ICONS = {
    "Navy": "anchor",
    "Air Force": "plane",
    "Army": "shield",
    "Marines": "user",
    "Joint": "star",
    "Space": "satellite-dish",
    "Rocket Force": "rocket",
    "Aerospace": "satellite-dish",
    "Cyber": "laptop",
    "Coast Guard": "ship",
}


def load_bases() -> list[dict]:
    bases: list[dict] = []
    for jf in sorted(BASES_DIR.glob("*.json")):
        with jf.open("r", encoding="utf-8") as f:
            data = json.load(f)
            bases.extend(data["bases"])
    return bases


def generate_folium(bases: list[dict], output: Path) -> None:
    import folium
    from folium.plugins import MarkerCluster

    m = folium.Map(location=[25.0, 130.0], zoom_start=4, tiles="CartoDB positron")

    groups: dict[str, folium.FeatureGroup] = {}
    for code, label in COUNTRY_LABELS.items():
        fg = folium.FeatureGroup(name=label, show=True)
        groups[code] = fg
        fg.add_to(m)

    for b in bases:
        lat, lon = b.get("latitude"), b.get("longitude")
        if lat is None or lon is None:
            continue
        country = b["country"]
        color = COUNTRY_COLORS.get(country, "gray")
        icon_name = BRANCH_ICONS.get(b["branch"], "info-sign")
        popup_html = (
            f"<b>{b['name']}</b><br>"
            f"{b.get('name_local', '')}<br>"
            f"<i>{b['branch']} — {b.get('type', '')}</i><br>"
            f"Role: {b.get('role', 'N/A')}<br>"
            f"Operator: {b.get('operator', 'N/A')}<br>"
            f"Est: {b.get('established', 'N/A')}"
        )
        marker = folium.Marker(
            location=[lat, lon],
            popup=folium.Popup(popup_html, max_width=350),
            tooltip=f"{b['name']} [{country}]",
            icon=folium.Icon(color=color, icon=icon_name, prefix="fa"),
        )
        fg = groups.get(country)
        if fg:
            marker.add_to(fg)
        else:
            marker.add_to(m)

    folium.LayerControl(collapsed=False).add_to(m)
    m.save(str(output))
    print(f"Map saved to {output}")


def generate_matplotlib(bases: list[dict], output: Path) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(16, 10))

    mpl_colors = {
        "US": "#1f77b4", "JP": "#17becf", "KR": "#2ca02c", "TW": "#7f7f7f",
        "PH": "#bcbd22", "AU": "#9467bd", "CN": "#d62728", "KP": "#8c564b",
    }

    for b in bases:
        lat, lon = b.get("latitude"), b.get("longitude")
        if lat is None or lon is None:
            continue
        c = mpl_colors.get(b["country"], "gray")
        ax.scatter(lon, lat, c=c, s=25, alpha=0.8, edgecolors="k", linewidths=0.3)

    handles = [
        plt.Line2D([0], [0], marker="o", color="w", markerfacecolor=mpl_colors.get(k, "gray"),
                    label=v, markersize=8)
        for k, v in COUNTRY_LABELS.items()
    ]
    ax.legend(handles=handles, loc="lower left", fontsize=8, title="Country")
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_title("First Island Chain Military Bases")
    ax.set_xlim(60, 200)
    ax.set_ylim(-45, 55)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    png_path = output.with_suffix(".png")
    fig.savefig(png_path, dpi=150)
    plt.close()
    print(f"Map saved to {png_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(ROOT / "map.html"), help="Output file")
    args = parser.parse_args()
    output = Path(args.output)

    bases = load_bases()
    valid_bases = [b for b in bases if b.get("latitude") is not None]
    print(f"Loaded {len(bases)} bases ({len(valid_bases)} with coordinates)")

    try:
        import folium  # noqa: F401
        generate_folium(bases, output)
    except ImportError:
        print("folium not installed; falling back to matplotlib PNG")
        try:
            generate_matplotlib(bases, output)
        except ImportError:
            print("Neither folium nor matplotlib available. Install with:")
            print("  pip install folium    # interactive HTML map")
            print("  pip install matplotlib  # static PNG map")


if __name__ == "__main__":
    main()
