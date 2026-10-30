#!/usr/bin/env python3
"""Extract this omnibus without importing its next-volume preview chapters.

Only Python's standard library is needed. The complete source and derived text
stay in ignored build/. Committed research contains selected evidence locators
and paraphrases, never the complete novel text.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
WORDS_PER_PAGE = 250
EXPECTED = {1: 17, 2: 18, 3: 22, 4: 37, 5: 38, 6: 30, 7: 37}
NS = {"o": "http://www.idpf.org/2007/opf", "d": "http://purl.org/dc/elements/1.1/"}
HTML = "{http://www.w3.org/1999/xhtml}"


def normalise(text: str) -> str:
    return " ".join(text.split())


def extract(source: Path) -> dict:
    books = []
    with zipfile.ZipFile(source) as archive:
        names = archive.namelist()
        page_targets = 0
        for name in names:
            if name.endswith((".ncx", ".html", ".xhtml")):
                tree = ET.fromstring(archive.read(name))
                for elem in tree.iter():
                    local = elem.tag.rsplit("}", 1)[-1]
                    if local == "pageTarget" or elem.get("{http://www.idpf.org/2007/ops}type") == "pagebreak":
                        page_targets += 1
        for book, count in EXPECTED.items():
            metadata = ET.fromstring(archive.read(f"{book}/OEBPS/content.opf"))
            title = metadata.findtext("o:metadata/d:title", namespaces=NS)
            identifiers = [e.text for e in metadata.findall("o:metadata/d:identifier", NS)]
            isbn = next((v for v in identifiers if v and re.fullmatch(r"\d{13}", v)), None)
            chapters = []
            word_offset = 0
            for chapter in range(1, count + 1):
                member = f"{book}/OEBPS/hp0{book}_ch{chapter:03d}_en-gb.html"
                tree = ET.fromstring(archive.read(member))
                chapter_title = normalise("".join(tree.find(f".//{HTML}h1").itertext()))
                paragraphs = []
                for source_ordinal, elem in enumerate(tree.findall(f".//{HTML}body//{HTML}p"), 1):
                    text = normalise("".join(elem.itertext()))
                    if not text:
                        continue
                    ordinal = len(paragraphs) + 1
                    words = len(text.split())
                    paragraphs.append({
                        "id": f"B{book:02d}-C{chapter:03d}-P{ordinal:04d}",
                        "paragraph": ordinal,
                        "source_p_ordinal": source_ordinal,
                        "source_element_id": elem.get("id"),
                        "word_start": word_offset,
                        "word_count": words,
                        "page_start": word_offset // WORDS_PER_PAGE + 1,
                        "page_end": (word_offset + words - 1) // WORDS_PER_PAGE + 1,
                        "text": text,
                    })
                    word_offset += words
                chapters.append({
                    "number": chapter, "title": chapter_title,
                    "is_epilogue": book == 7 and chapter == 37,
                    "source_member": member, "paragraphs": paragraphs,
                })
            books.append({
                "number": book, "title": title, "isbn": isbn,
                "word_count": word_offset,
                "reference_pages": (word_offset + WORDS_PER_PAGE - 1) // WORDS_PER_PAGE,
                "chapters": chapters,
            })
        previews = [name for name in names if (m := re.fullmatch(
            r"(\d)/OEBPS/hp0(\d)_ch\d{3}_en-gb.html", name
        )) and m[1] != m[2]]
    return {
        "schema_version": 1,
        "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "source_filename": source.name,
        "pagination": {"scheme": "ref250-v1", "words_per_page": WORDS_PER_PAGE,
                       "reset": "per book", "printed_page_map": page_targets > 0,
                       "word_rule": "normalised paragraph text split on whitespace; headings excluded"},
        "excluded_preview_members": previews, "books": books,
    }


def write_corpus(corpus: dict, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "corpus.json").write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n")
    for book in corpus["books"]:
        folder = destination / f"book-{book['number']:02d}"
        folder.mkdir(exist_ok=True)
        for chapter in book["chapters"]:
            lines = [f"{book['title']} | Chapter {chapter['number']}: {chapter['title']}", ""]
            for p in chapter["paragraphs"]:
                lines.extend([f"[{p['id']} | ref p. {p['page_start']}-{p['page_end']}] {p['text']}", ""])
            (folder / f"chapter-{chapter['number']:03d}.txt").write_text("\n".join(lines))
    inventory = {
        key: value for key, value in corpus.items() if key != "books"
    }
    inventory["books"] = [
        {**{k: v for k, v in book.items() if k != "chapters"}, "chapters": [
            {**{k: v for k, v in ch.items() if k != "paragraphs"},
             "paragraph_count": len(ch["paragraphs"]),
             "word_count": sum(p["word_count"] for p in ch["paragraphs"])}
            for ch in book["chapters"]
        ]} for book in corpus["books"]
    ]
    (destination / "inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", type=Path, default=ROOT / "Harry Potter.epub")
    parser.add_argument("--output", type=Path, default=ROOT / "build")
    args = parser.parse_args()
    corpus = extract(args.source)
    write_corpus(corpus, args.output)
    print(json.dumps({"sha256": corpus["source_sha256"], "books": len(corpus["books"]),
                      "chapters": sum(len(b["chapters"]) for b in corpus["books"]),
                      "paragraphs": sum(len(c["paragraphs"]) for b in corpus["books"] for c in b["chapters"]),
                      "words": sum(b["word_count"] for b in corpus["books"]),
                      "printed_page_map": corpus["pagination"]["printed_page_map"]}))


if __name__ == "__main__":
    main()
