import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import scripts.check_updates as monitor
from scripts.check_updates import (
    build_monitor_run,
    merge_feed,
    merge_review_queue,
    normalize_item,
    parse_feed,
)
from scripts.validate_registry import validate_registry_file


class MonitorFunctionsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.source_url = "https://ec.europa.eu/commission/presscorner/api/rss?language=en"
        self.first = normalize_item(
            {
                "title": "  Commission opens DSA proceedings against Booking.com  ",
                "link": "https://digital-strategy.ec.europa.eu/en/news/booking",
                "date": "2026-10-21",
                "summary": "Official Booking.com DSA proceeding.",
            },
            source_url=self.source_url,
        )

    def test_merge_feed_deduplicates_duplicate_links_and_normalized_titles(self) -> None:
        duplicate_link = normalize_item(
            {
                "title": "A revised title from the same official page",
                "link": self.first["link"],
                "date": self.first["date"],
                "summary": "Same source URL.",
            },
            source_url=self.source_url,
        )
        duplicate_title = normalize_item(
            {
                "title": "Commission opens DSA proceedings against Booking.com",
                "link": "https://digital-strategy.ec.europa.eu/en/news/booking-mirror",
                "date": self.first["date"],
                "summary": "Same normalized announcement title.",
            },
            source_url=self.source_url,
        )
        other = normalize_item(
            {
                "title": "Commission publishes a different DSA update",
                "link": "https://digital-strategy.ec.europa.eu/en/news/other",
                "date": "2026-10-22",
                "summary": "Another official update.",
            },
            source_url=self.source_url,
        )

        result = merge_feed([], [self.first, duplicate_link, duplicate_title, other])

        self.assertEqual([item["link"] for item in result], [self.first["link"], other["link"]])

    def test_parse_feed_rejects_malformed_and_empty_xml(self) -> None:
        with self.assertRaises(ValueError):
            parse_feed("<rss><channel>", source_url=self.source_url)
        with self.assertRaises(ValueError):
            parse_feed("<rss><channel></channel></rss>", source_url=self.source_url)

    def test_review_queue_preserves_human_decision_and_adds_new_items(self) -> None:
        existing = [
            {
                "review_id": "review-accepted",
                "item_key": self.first["item_key"],
                "title": self.first["title"],
                "link": self.first["link"],
                "published_at": self.first["date"],
                "source_type": self.first["source_type"],
                "evidence_snapshot": "Previously reviewed evidence.",
                "status": "accepted",
                "created_at": "2026-10-21T00:00:00+00:00",
            }
        ]
        new_item = normalize_item(
            {
                "title": "Commission publishes a new DSA update",
                "link": "https://digital-strategy.ec.europa.eu/en/news/new",
                "date": "2026-10-23",
                "summary": "New item for human review.",
            },
            source_url=self.source_url,
        )

        result = merge_review_queue(existing, [self.first, new_item], now="2026-10-23T01:00:00+00:00")

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["status"], "accepted")
        self.assertEqual(result[1]["status"], "pending")
        self.assertEqual(result[1]["item_key"], new_item["item_key"])

    def test_monitor_failure_record_is_explicit(self) -> None:
        record = build_monitor_run(
            source_type="EC Press Corner RSS",
            started_at="2026-11-20T01:00:00+00:00",
            finished_at="2026-11-20T01:00:04+00:00",
            items_found=0,
            status="failed",
            error="Malformed RSS",
        )

        self.assertEqual(record["status"], "failed")
        self.assertEqual(record["items_found"], 0)
        self.assertEqual(record["error"], "Malformed RSS")

    def test_registry_validator_reports_broken_foreign_keys(self) -> None:
        registry_path = Path("public/data/registry.json")
        payload = json.loads(registry_path.read_text(encoding="utf-8"))
        payload["case_events"][0]["case_id"] = "missing-case"
        with tempfile.TemporaryDirectory() as directory:
            broken_path = Path(directory) / "registry.json"
            broken_path.write_text(json.dumps(payload), encoding="utf-8")
            errors = validate_registry_file(broken_path)
        self.assertTrue(any("unknown case_id" in error for error in errors))

    def test_main_preserves_last_good_feed_and_records_failure(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            updates_path = root / "updates.json"
            queue_path = root / "review_queue.json"
            runs_path = root / "monitor_runs.json"
            previous = {
                "updated_at": "2026-11-19T00:00:00+00:00",
                "source": monitor.RSS_URL,
                "items": [self.first],
            }
            updates_path.write_text(json.dumps(previous), encoding="utf-8")
            with patch.object(monitor, "OUTPUT", updates_path), patch.object(monitor, "REVIEW_QUEUE_OUTPUT", queue_path), patch.object(monitor, "MONITOR_RUNS_OUTPUT", runs_path), patch.object(monitor, "fetch_feed", side_effect=ValueError("Malformed RSS")):
                with self.assertRaises(ValueError):
                    monitor.main()
            self.assertEqual(json.loads(updates_path.read_text(encoding="utf-8")), previous)
            runs = json.loads(runs_path.read_text(encoding="utf-8"))
            self.assertEqual(runs["runs"][-1]["status"], "failed")
            self.assertEqual(runs["runs"][-1]["error"], "Malformed RSS")

    def test_main_does_not_rewrite_an_unchanged_feed(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            updates_path = root / "updates.json"
            queue_path = root / "review_queue.json"
            runs_path = root / "monitor_runs.json"
            previous = {
                "updated_at": "2026-11-19T00:00:00+00:00",
                "source": monitor.RSS_URL,
                "items": [self.first],
            }
            queue = {
                "updated_at": "2026-11-19T00:00:00+00:00",
                "items": [
                    {
                        "review_id": "review-accepted",
                        "item_key": self.first["item_key"],
                        "title": self.first["title"],
                        "link": self.first["link"],
                        "published_at": self.first["date"],
                        "source_type": self.first["source_type"],
                        "evidence_snapshot": "Accepted evidence.",
                        "status": "accepted",
                        "created_at": "2026-11-19T00:00:00+00:00",
                    }
                ],
            }
            updates_path.write_text(json.dumps(previous), encoding="utf-8")
            queue_path.write_text(json.dumps(queue), encoding="utf-8")
            with patch.object(monitor, "OUTPUT", updates_path), patch.object(monitor, "REVIEW_QUEUE_OUTPUT", queue_path), patch.object(monitor, "MONITOR_RUNS_OUTPUT", runs_path), patch.object(monitor, "fetch_feed", return_value=[self.first]):
                monitor.main()
            self.assertEqual(json.loads(updates_path.read_text(encoding="utf-8")), previous)
            self.assertEqual(json.loads(queue_path.read_text(encoding="utf-8")), queue)
            runs = json.loads(runs_path.read_text(encoding="utf-8"))
            self.assertEqual(runs["runs"][-1]["status"], "success")


if __name__ == "__main__":
    unittest.main()
