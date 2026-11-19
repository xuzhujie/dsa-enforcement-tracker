#!/usr/bin/env python3
"""Refresh the bilingual DSA update feed from official EU RSS sources.

The script intentionally keeps the case register curated in TypeScript. It only
refreshes a small, source-linked activity feed so that a noisy news scrape cannot
silently change the underlying case history.
"""

from __future__ import annotations

import json
import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path


RSS_URL = "https://ec.europa.eu/commission/presscorner/api/rss?language=en"
KEYWORDS = (
    "digital services act",
    "dsa",
    "very large online platform",
    "vlop",
    "vlose",
    "digital services coordinator",
)
MAX_ITEMS = 50
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "data" / "updates.json"


def clean_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", text).strip()


def fetch_feed() -> list[dict[str, str]]:
    request = urllib.request.Request(
        RSS_URL,
        headers={"User-Agent": "dsa-enforcement-tracker/0.1 (+official-source-monitor)"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        root = ET.fromstring(response.read())

    items: list[dict[str, str]] = []
    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        summary = clean_html(item.findtext("description") or "")
        published = (item.findtext("pubDate") or "").strip()
        haystack = f"{title} {summary}".lower()
        if not link or not any(keyword in haystack for keyword in KEYWORDS):
            continue
        try:
            date = parsedate_to_datetime(published).date().isoformat()
        except (TypeError, ValueError):
            date = published[:10] or datetime.now(timezone.utc).date().isoformat()
        items.append(
            {
                "title": title,
                "link": link,
                "date": date,
                "summary": summary[:420],
                "title_zh": title,
                "summary_zh": summary[:420],
            }
        )
    return items[:MAX_ITEMS]


def write_output(items: list[dict[str, str]]) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": RSS_URL,
        "items": items,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_github_outputs(count: int) -> None:
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a", encoding="utf-8") as handle:
            handle.write(f"count={count}\n")


def main() -> None:
    items = fetch_feed()
    write_output(items)
    write_github_outputs(len(items))
    print(f"Wrote {len(items)} DSA update(s) to {OUTPUT}")


if __name__ == "__main__":
    main()
