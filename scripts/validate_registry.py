#!/usr/bin/env python3
"""Validate the generated DSA registry and its cross-object references."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Mapping, Sequence


REQUIRED_COLLECTIONS = (
    "enforcement_cases",
    "case_events",
    "legal_basis",
    "entities",
    "regulators",
    "remedies_measures",
    "fines",
    "compliance_actions",
    "sources",
    "review_logs",
    "monitor_runs",
    "review_queue",
    "calendar",
)


def _is_bilingual(value: Any) -> bool:
    return isinstance(value, Mapping) and isinstance(value.get("zh"), str) and isinstance(value.get("en"), str)


def _check_case_refs(collection: Any, name: str, case_ids: set[str], errors: list[str]) -> None:
    if not isinstance(collection, list):
        errors.append(f"{name} must be an array")
        return
    for index, item in enumerate(collection):
        if not isinstance(item, Mapping):
            errors.append(f"{name}[{index}] must be an object")
            continue
        case_id = item.get("case_id")
        if not isinstance(case_id, str) or case_id not in case_ids:
            errors.append(f"{name}[{index}] references unknown case_id: {case_id}")


def validate_registry_payload(payload: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(payload, Mapping):
        return ["registry root must be an object"]

    for collection in REQUIRED_COLLECTIONS:
        if not isinstance(payload.get(collection), list):
            errors.append(f"missing or invalid collection: {collection}")

    cases = payload.get("enforcement_cases")
    if not isinstance(cases, list):
        return errors

    case_ids = {item.get("case_id") for item in cases if isinstance(item, Mapping)}
    case_ids.discard(None)
    if len(case_ids) != len(cases):
        errors.append("enforcement_cases contains duplicate or missing case_id values")

    for index, item in enumerate(cases):
        if not isinstance(item, Mapping):
            errors.append(f"enforcement_cases[{index}] must be an object")
            continue
        required = ("case_id", "source_url", "source_type", "evidence_snapshot", "last_verified_at")
        for field in required:
            if not item.get(field):
                errors.append(f"enforcement_cases[{index}] missing {field}")
        if item.get("case_id") not in case_ids:
            errors.append(f"enforcement_cases[{index}] has invalid case_id")
        if not str(item.get("source_url", "")).startswith("http"):
            errors.append(f"enforcement_cases[{index}] source_url must be HTTP(S)")
        if not _is_bilingual(item.get("title")) or not _is_bilingual(item.get("status")):
            errors.append(f"enforcement_cases[{index}] title and status must be bilingual")

    for name in ("case_events", "legal_basis", "remedies_measures", "fines", "compliance_actions", "review_logs"):
        _check_case_refs(payload.get(name), name, case_ids, errors)

    sources = payload.get("sources")
    if isinstance(sources, list):
        source_ids: set[str] = set()
        for index, item in enumerate(sources):
            if not isinstance(item, Mapping):
                errors.append(f"sources[{index}] must be an object")
                continue
            source_id = item.get("source_id")
            if not isinstance(source_id, str) or source_id in source_ids:
                errors.append(f"sources[{index}] has duplicate or missing source_id")
            source_ids.add(source_id)
            if not str(item.get("url", "")).startswith("http"):
                errors.append(f"sources[{index}] url must be HTTP(S)")
            case_id = item.get("case_id")
            if case_id is not None and case_id not in case_ids:
                errors.append(f"sources[{index}] references unknown case_id: {case_id}")

    entities = payload.get("entities")
    if isinstance(entities, list):
        for index, item in enumerate(entities):
            if not isinstance(item, Mapping):
                errors.append(f"entities[{index}] must be an object")
                continue
            for case_id in item.get("case_ids", []):
                if case_id not in case_ids:
                    errors.append(f"entities[{index}] references unknown case_id: {case_id}")

    runs = payload.get("monitor_runs")
    if isinstance(runs, list):
        run_ids: set[str] = set()
        for index, item in enumerate(runs):
            if not isinstance(item, Mapping):
                errors.append(f"monitor_runs[{index}] must be an object")
                continue
            run_id = item.get("run_id")
            if not isinstance(run_id, str) or run_id in run_ids:
                errors.append(f"monitor_runs[{index}] has duplicate or missing run_id")
            run_ids.add(run_id)
            if item.get("status") not in {"success", "failed"}:
                errors.append(f"monitor_runs[{index}] has invalid status")

    queue = payload.get("review_queue")
    if isinstance(queue, list):
        review_keys: set[str] = set()
        for index, item in enumerate(queue):
            if not isinstance(item, Mapping):
                errors.append(f"review_queue[{index}] must be an object")
                continue
            key = item.get("item_key")
            if not isinstance(key, str) or key in review_keys:
                errors.append(f"review_queue[{index}] has duplicate or missing item_key")
            review_keys.add(key)
            if item.get("status") not in {"pending", "accepted", "rejected"}:
                errors.append(f"review_queue[{index}] has invalid status")

    return errors


def validate_registry_file(path: Path | str) -> list[str]:
    registry_path = Path(path)
    try:
        payload = json.loads(registry_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return [f"registry file not found: {registry_path}"]
    except json.JSONDecodeError as exc:
        return [f"registry JSON is invalid: {exc}"]
    except OSError as exc:
        return [f"registry file could not be read: {exc}"]
    return validate_registry_payload(payload)


def main() -> int:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/data/registry.json")
    errors = validate_registry_file(path)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print(f"Validated registry: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
