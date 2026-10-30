#!/usr/bin/env python3
"""Independently check generated pages against every extracted source word."""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

from corpus import chapter_blocks


class ReaderParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.page = None
        self.paragraph = None
        self.in_ref = False
        self.pages = {}
        self.paragraphs = {}
        self.ranges = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "section" and attrs.get("class") == "page":
            self.page = int(attrs["id"].removeprefix("page-"))
            if self.page in self.pages:
                raise ValueError(f"Duplicate page {self.page}")
            self.pages[self.page] = []
        if tag == "p" and attrs.get("id", "").startswith("B"):
            self.paragraph = attrs["id"].split("--page-")[0]
            self.paragraphs.setdefault(self.paragraph, [])
            self.ranges.setdefault(self.paragraph, []).append(self.page)
        if tag == "a" and attrs.get("class") == "ref":
            self.in_ref = True

    def handle_endtag(self, tag):
        if tag == "p":
            self.paragraph = None
        if tag == "a":
            self.in_ref = False

    def handle_data(self, data):
        if self.paragraph and not self.in_ref:
            words = data.split()
            self.pages[self.page].extend(words)
            self.paragraphs[self.paragraph].extend(words)


def verify(corpus: dict, folder: Path) -> dict:
    words = paragraphs = pages = extras = 0
    for book in corpus["books"]:
        parsed = ReaderParser()
        parsed.feed((folder / f"book-{book['number']:02d}.html").read_text())
        source = [p for chapter in book["chapters"] for p in chapter_blocks(chapter)]
        if list(parsed.paragraphs) != [p["id"] for p in source]:
            raise ValueError(f"Book {book['number']}: missing, extra or reordered paragraph")
        for p in source:
            if parsed.paragraphs[p["id"]] != p["text"].split():
                raise ValueError(f"{p['id']}: reader/source text mismatch")
            if parsed.ranges[p["id"]] != list(range(p["page_start"], p["page_end"] + 1)):
                raise ValueError(f"{p['id']}: reader/citation page mismatch")
        if list(parsed.pages) != list(range(1, book["reference_pages"] + 1)):
            raise ValueError(f"Book {book['number']}: missing or reordered page")
        for page, content in parsed.pages.items():
            expected = 250 if page < book["reference_pages"] else (book["word_count"] - (page - 1)*250)
            if len(content) != expected:
                raise ValueError(f"Book {book['number']}, page {page}: {len(content)} words; expected {expected}")
        words += book["word_count"]
        paragraphs += sum(not p.get("is_extra") for p in source)
        extras += sum(bool(p.get("is_extra")) for p in source)
        pages += len(parsed.pages)
    return {"books": len(corpus["books"]), "paragraphs": paragraphs, "words": words,
            "additional_text_blocks": extras,
            "reference_pages": pages, "source_text_and_page_ranges_match": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=ROOT / "build/corpus.json")
    parser.add_argument("--reader", type=Path, default=ROOT / "build/reader")
    args = parser.parse_args()
    print(json.dumps(verify(json.loads(args.corpus.read_text()), args.reader), indent=2))


if __name__ == "__main__":
    main()
