#!/usr/bin/env python3
"""Monitor official DSA feeds without silently changing verified case records.

The monitor owns three operational files only:

* ``updates.json`` keeps the source-linked activity feed used by the UI;
* ``review_queue.json`` holds unseen announcements for human review; and
* ``monitor_runs.json`` records successful and failed runs.

The curated case register is intentionally not edited by this script. A human
must promote a reviewed item into ``src/data/cases.ts`` before it becomes a
verified case in the generated registry.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any, Iterable, Mapping, Optional, Sequence
from urllib.parse import urlsplit, urlunsplit


RSS_URL = "https://ec.europa.eu/commission/presscorner/api/rss?language=en"
SOURCE_TYPE = "EC Press Corner RSS"
KEYWORDS = (
    "digital services act",
    "dsa",
    "very large online platform",
    "vlop",
    "vlose",
    "digital services coordinator",
)
MAX_ITEMS = 50
MAX_REVIEW_QUEUE = 200
MAX_MONITOR_RUNS = 100
FETCH_RETRIES = 3
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "data" / "updates.json"
REVIEW_QUEUE_OUTPUT = ROOT / "public" / "data" / "review_queue.json"
MONITOR_RUNS_OUTPUT = ROOT / "public" / "data" / "monitor_runs.json"


def clean_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", text).strip()


def clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def canonical_url(value: Any) -> str:
    raw = clean_text(value)
    if not raw:
        return ""
    parts = urlsplit(raw)
    if not parts.scheme or not parts.netloc:
        return raw.rstrip("/")
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), parts.query, ""))


def normalized_title(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", clean_text(value).lower()).strip()


def normalize_date(value: Any) -> str:
    raw = clean_text(value)
    if not raw:
        return datetime.now(timezone.utc).date().isoformat()
    try:
        return parsedate_to_datetime(raw).date().isoformat()
    except (TypeError, ValueError, OverflowError):
        return raw[:10]


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:20]


def _title_identity(item: Mapping[str, Any]) -> str:
    title = normalized_title(item.get("title"))
    date = normalize_date(item.get("date") or item.get("published_at"))
    return f"title-{_digest(f'{title}|{date}')}"


def _link_identity(item: Mapping[str, Any]) -> str:
    link = canonical_url(item.get("link"))
    return f"url-{_digest(link)}" if link else ""


def item_key(item: Mapping[str, Any]) -> str:
    """Return a stable primary key, preferring the canonical official URL."""

    link_key = _link_identity(item)
    return link_key or _title_identity(item)


def _identity_keys(item: Mapping[str, Any]) -> set[str]:
    keys = {item_key(item), _title_identity(item)}
    link_key = _link_identity(item)
    if link_key:
        keys.add(link_key)
    return {key for key in keys if key}


def normalize_item(raw: Mapping[str, Any], source_url: str = RSS_URL) -> dict[str, str]:
    """Normalize a raw feed item into the stable public update schema."""

    title = clean_text(raw.get("title"))
    link = canonical_url(raw.get("link"))
    if not title or not link:
        raise ValueError("Feed item requires a title and an absolute link")

    summary = clean_html(clean_text(raw.get("summary") or raw.get("description")))
    date = normalize_date(raw.get("date") or raw.get("published_at") or raw.get("pubDate"))
    source = clean_text(raw.get("source_type")) or SOURCE_TYPE
    normalized = {
        "title": title,
        "title_zh": clean_text(raw.get("title_zh")) or title,
        "link": link,
        "date": date,
        "published_at": date,
        "summary": summary[:420],
        "summary_zh": clean_text(raw.get("summary_zh"))[:420] or summary[:420],
        "source_type": source,
        "source_url": canonical_url(raw.get("source_url")) or canonical_url(source_url),
    }
    normalized["item_key"] = item_key(normalized)
    return normalized


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def _child_text(element: ET.Element, names: Iterable[str]) -> str:
    wanted = {name.lower() for name in names}
    for child in list(element):
        if _local_name(child.tag) in wanted:
            return clean_text(child.text)
    return ""


def _child_link(element: ET.Element) -> str:
    for child in list(element):
        if _local_name(child.tag) != "link":
            continue
        href = clean_text(child.attrib.get("href"))
        if href:
            return href
        if child.text:
            return clean_text(child.text)
    return ""


def parse_feed(xml_text: str, source_url: str = RSS_URL) -> list[dict[str, str]]:
    """Parse and keyword-filter RSS/Atom XML without performing network I/O."""

    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        raise ValueError(f"Malformed RSS: {exc}") from exc

    entries = [element for element in root.iter() if _local_name(element.tag) in {"item", "entry"}]
    if not entries:
        raise ValueError("Feed returned no items")

    normalized_items: list[dict[str, str]] = []
    for entry in entries:
        raw = {
            "title": _child_text(entry, ("title",)),
            "link": _child_link(entry),
            "summary": _child_text(entry, ("description", "summary", "content")),
            "date": _child_text(entry, ("pubdate", "published", "updated", "date")),
        }
        try:
            item = normalize_item(raw, source_url=source_url)
        except ValueError:
            continue
        haystack = f"{item['title']} {item['summary']}".lower()
        if any(keyword in haystack for keyword in KEYWORDS):
            normalized_items.append(item)
    return normalized_items


def fetch_feed(source_url: str = RSS_URL, retries: int = FETCH_RETRIES) -> list[dict[str, str]]:
    last_error: Optional[Exception] = None
    for attempt in range(max(1, retries)):
        try:
            request = urllib.request.Request(
                source_url,
                headers={"User-Agent": "dsa-enforcement-tracker/0.2 (+official-source-monitor)"},
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                xml_text = response.read().decode("utf-8", errors="replace")
            return parse_feed(xml_text, source_url=source_url)
        except (OSError, ValueError, ET.ParseError) as exc:
            last_error = exc
            if attempt + 1 < max(1, retries):
                time.sleep(1)
    raise RuntimeError(f"Unable to read official DSA feed after {max(1, retries)} attempt(s): {last_error}") from last_error


def merge_feed(existing: Sequence[Mapping[str, Any]], incoming: Sequence[Mapping[str, Any]], limit: int = MAX_ITEMS) -> list[dict[str, str]]:
    """Merge source items, deduplicating by URL and normalized title/date."""

    merged: list[dict[str, str]] = []
    seen: set[str] = set()
    for raw in [*incoming, *existing]:
        item = normalize_item(raw, source_url=clean_text(raw.get("source_url")) or RSS_URL)
        identities = _identity_keys(item)
        if seen.intersection(identities):
            continue
        seen.update(identities)
        merged.append(item)
        if len(merged) >= limit:
            break
    return merged


def merge_review_queue(
    existing: Sequence[Mapping[str, Any]],
    items: Sequence[Mapping[str, Any]],
    now: Optional[str] = None,
    limit: int = MAX_REVIEW_QUEUE,
) -> list[dict[str, Any]]:
    """Append unseen announcements while preserving human review decisions."""

    created_at = now or datetime.now(timezone.utc).isoformat()
    result: list[dict[str, Any]] = [dict(item) for item in existing]
    seen: set[str] = set()
    for existing_item in result:
        seen.update(_identity_keys(existing_item))

    for raw in items:
        item = normalize_item(raw, source_url=clean_text(raw.get("source_url")) or RSS_URL)
        identities = _identity_keys(item)
        if seen.intersection(identities):
            continue
        seen.update(identities)
        result.append(
            {
                "review_id": f"review-{item['item_key']}",
                "item_key": item["item_key"],
                "title": item["title"],
                "link": item["link"],
                "published_at": item["date"],
                "source_type": item["source_type"],
                "evidence_snapshot": item["summary"] or f"Captured from {item['source_url']}",
                "status": "pending",
                "created_at": created_at,
            }
        )
    return result[-limit:]


def build_monitor_run(
    source_type: str,
    started_at: str,
    finished_at: str,
    items_found: int,
    status: str,
    error: Optional[str] = None,
) -> dict[str, Any]:
    run_id = f"run-{_digest(f'{source_type}|{started_at}|{finished_at}|{status}')}"
    record: dict[str, Any] = {
        "run_id": run_id,
        "source_type": source_type,
        "started_at": started_at,
        "finished_at": finished_at,
        "items_found": items_found,
        "status": status,
    }
    if error:
        record["error"] = error
    return record


def read_json(path: Path, fallback: Mapping[str, Any]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return dict(fallback)
    return value if isinstance(value, dict) else dict(fallback)


def atomic_write_json(path: Path, payload: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def write_output(items: Sequence[Mapping[str, Any]], updated_at: Optional[str] = None) -> None:
    atomic_write_json(
        OUTPUT,
        {
            "updated_at": updated_at or datetime.now(timezone.utc).isoformat(),
            "source": RSS_URL,
            "items": list(items),
        },
    )


def write_github_outputs(count: int, status: str = "success") -> None:
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a", encoding="utf-8") as handle:
            handle.write(f"count={count}\n")
            handle.write(f"status={status}\n")


def _items_changed(left: Sequence[Mapping[str, Any]], right: Sequence[Mapping[str, Any]]) -> bool:
    left_keys = [item_key(item) for item in left]
    right_keys = [item_key(item) for item in right]
    return left_keys != right_keys


def _append_run(existing: Mapping[str, Any], run: Mapping[str, Any]) -> dict[str, Any]:
    runs = existing.get("runs", [])
    if not isinstance(runs, list):
        runs = []
    return {
        "updated_at": run["finished_at"],
        "runs": [*runs, dict(run)][-MAX_MONITOR_RUNS:],
    }


def main() -> None:
    started_at = datetime.now(timezone.utc).isoformat()
    existing_updates = read_json(OUTPUT, {"updated_at": None, "source": RSS_URL, "items": []})
    existing_queue = read_json(REVIEW_QUEUE_OUTPUT, {"updated_at": None, "items": []})
    existing_runs = read_json(MONITOR_RUNS_OUTPUT, {"updated_at": None, "runs": []})
    existing_items = existing_updates.get("items", [])
    existing_queue_items = existing_queue.get("items", [])
    if not isinstance(existing_items, list):
        existing_items = []
    if not isinstance(existing_queue_items, list):
        existing_queue_items = []

    try:
        incoming = fetch_feed()
        merged = merge_feed(existing_items, incoming)
        new_items = merge_feed([], incoming)
        existing_identity_keys = set().union(*(_identity_keys(item) for item in existing_items)) if existing_items else set()
        new_items = [item for item in new_items if not existing_identity_keys.intersection(_identity_keys(item))]
        finished_at = datetime.now(timezone.utc).isoformat()
        if _items_changed(existing_items, merged):
            write_output(merged, updated_at=finished_at)

        queue = merge_review_queue(existing_queue_items, incoming, now=finished_at)
        if queue != existing_queue_items:
            atomic_write_json(REVIEW_QUEUE_OUTPUT, {"updated_at": finished_at, "items": queue})

        run = build_monitor_run(SOURCE_TYPE, started_at, finished_at, len(incoming), "success")
        atomic_write_json(MONITOR_RUNS_OUTPUT, _append_run(existing_runs, run))
        write_github_outputs(len(new_items), status="success")
        print(f"Monitored {len(incoming)} official DSA update(s); {len(new_items)} new item(s) queued for review")
    except Exception as exc:
        finished_at = datetime.now(timezone.utc).isoformat()
        run = build_monitor_run(SOURCE_TYPE, started_at, finished_at, 0, "failed", error=str(exc))
        atomic_write_json(MONITOR_RUNS_OUTPUT, _append_run(existing_runs, run))
        write_github_outputs(0, status="failed")
        print(f"Official DSA monitor failed: {exc}")
        raise


if __name__ == "__main__":
    main()
