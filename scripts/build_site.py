#!/usr/bin/env python3
"""Build the browsable description site.

The default build quotes every paragraph the catalogue cites, so build/site/
holds extracted book text and must stay out of Git and off the web.

--public builds the edition published to GitHub Pages under build/public-site/.
It reads only committed files, so no book text can reach it: entries rest on
their paraphrases and citations.

Neither edition needs a server or network: open its index.html directly.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import sys

from catalogue import ROOT, load_json, paragraph_index

ASSETS = ("index.html", "style.css", "app.js")


def short_title(title: str) -> str:
    return title.removeprefix("Harry Potter and the ")


def site_citation(citation: dict) -> dict:
    return {"id": citation["id"], "book": citation["book"], "chapter": citation["chapter"],
            "paragraph": citation["paragraph"], "pageStart": citation["page_start"],
            "pageEnd": citation["page_end"], "words": citation["word_count"],
            "label": citation["label"], "member": citation["source_member"],
            "element": f"{citation['source_element_tag']}[{citation['source_element_ordinal']}]",
            "slot": citation["source_text_slot"]}


def cited_passages(corpus: dict, catalogue: dict) -> dict:
    """Return the text of every cited paragraph. Only these enter the local site."""
    if corpus["source_sha256"] != catalogue["source_sha256"]:
        raise ValueError("Corpus and compiled catalogue come from different sources")
    index = paragraph_index(corpus)
    return {ref: index[ref]["text"] for entry in catalogue["entries"] for ref in entry["evidence"]}


def site_data(inventory: dict, catalogue: dict, area_config: dict, places: dict, overviews: dict,
              passages: dict | None = None) -> dict:
    """Assemble the site from committed records. Without passages it holds no book text."""
    if inventory["source_sha256"] != catalogue["source_sha256"]:
        raise ValueError("Inventory and compiled catalogue come from different sources")
    passages = passages or {}
    return {
        "meta": {"sourceSha256": inventory["source_sha256"],
                 "pagination": catalogue["pagination"],
                 "paragraphs": sum(ch["paragraph_count"] for book in inventory["books"] for ch in book["chapters"]),
                 "quotedWords": sum(len(text.split()) for text in passages.values())},
        "books": [{"number": book["number"], "title": book["title"], "shortTitle": short_title(book["title"]),
                   "chapters": [{"number": ch["number"], "title": ch["title"], "epilogue": ch["is_epilogue"]}
                                for ch in book["chapters"]]}
                  for book in inventory["books"]],
        "areas": area_config["areas"],
        "places": places["places"],
        "overviews": {key: overviews[key] for key in ("castle", "areas", "places")},
        "passages": passages,
        "entries": [{"id": entry["id"], "location": entry["location"], "category": entry["category"],
                     "certainty": entry["certainty"], "temporal": entry["temporal"],
                     "description": entry["description"], "notes": entry["model_notes"],
                     "places": entry["places"], "areas": entry["areas"],
                     "citations": [site_citation(c) for c in entry["citations"]]}
                    for entry in catalogue["entries"]],
    }


def write_site(data: dict, assets: Path, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    for name in ASSETS:
        shutil.copyfile(assets / name, output / name)
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    (output / "data.js").write_text(f"window.HOGWARTS_DATA={payload};\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=ROOT / "build/corpus.json")
    parser.add_argument("--catalogue", type=Path, default=ROOT / "research/catalogue.json")
    parser.add_argument("--assets", type=Path, default=ROOT / "web")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--public", action="store_true", help="leave out the book text and read only committed files")
    args = parser.parse_args()
    catalogue = load_json(args.catalogue)
    passages = None
    if not args.public:
        if not args.corpus.exists():
            sys.exit(f"Missing {args.corpus}: run scripts/corpus.py on the ebook first")
        passages = cited_passages(load_json(args.corpus), catalogue)
    data = site_data(load_json(ROOT / "research/source-inventory.json"), catalogue,
                     load_json(ROOT / "research/areas.json"), load_json(ROOT / "research/places.json"),
                     load_json(ROOT / "research/overviews.json"), passages)
    output = args.output or ROOT / ("build/public-site" if args.public else "build/site")
    write_site(data, args.assets, output)
    print(f"Built {len(data['entries'])} entries quoting {data['meta']['quotedWords']:,} words: {output / 'index.html'}")


if __name__ == "__main__":
    main()
