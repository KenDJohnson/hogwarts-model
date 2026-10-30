#!/usr/bin/env python3
"""Check committed research and generated exports without requiring the ebook.

This checks reference bounds and export consistency against the committed
source inventory. Rebuilding with the original ebook is required to verify
the content of evidence or the underlying word offsets independently.
"""
import argparse
import json
from pathlib import Path
import re

from catalogue import ROOT, citation, load_json, read_research, validate, validate_model_constraints


def check(root: Path, require_complete: bool = False) -> dict:
    inventory = load_json(root / "research/source-inventory.json")
    corpus = {"source_sha256": inventory["source_sha256"], "books": []}
    for book in inventory["books"]:
        chapters = []
        for chapter in book["chapters"]:
            paragraphs = [{"id": f"B{book['number']:02d}-C{chapter['number']:03d}-P{p:04d}", "paragraph": p}
                          for p in range(1, chapter["paragraph_count"]+1)]
            chapters.append({**chapter, "paragraphs": paragraphs})
        corpus["books"].append({**book, "chapters": chapters})
    records = read_research(root / "research/books")
    errors, coverage = validate(corpus, records)
    errors.extend(validate_model_constraints(corpus, load_json(root / "research/model-constraints.json")))
    expected = {entry["id"]: entry for record in records for entry in record["entries"]}
    compiled = load_json(root / "research/catalogue.json")
    actual = {entry["id"]: entry for entry in compiled["entries"]}
    if len(actual) != len(compiled["entries"]):
        errors.append("Duplicate compiled entry")
    if set(actual) != set(expected):
        errors.append("Compiled entry IDs differ from the manually reviewed records")
    if compiled["source_sha256"] != inventory["source_sha256"] or compiled["pagination"] != inventory["pagination"]:
        errors.append("Compiled source identity or pagination differs from inventory")
    books = {b["number"]:b for b in inventory["books"]}
    for ident in sorted(set(actual) & set(expected)):
        source, result = expected[ident], actual[ident]
        for field, value in source.items():
            if result.get(field) != value:
                errors.append(f"{ident}: compiled {field} differs from manual record")
        if result["evidence"] != [c["id"] for c in result["citations"]]:
            errors.append(f"{ident}: citation list differs from evidence list")
        for ref in result["citations"]:
            match = re.fullmatch(r"B(\d{2})-C(\d{3})-([PX])(\d{4,})", ref["id"])
            if not match:
                errors.append(f"{ident}: invalid compiled reference ID")
                continue
            number, chapter, kind, ordinal = match.groups()
            number, chapter, ordinal = int(number),int(chapter),int(ordinal)
            paragraph = ordinal if kind == "P" else None
            if (ref["book"],ref["chapter"],ref["paragraph"]) != (number,chapter,paragraph):
                errors.append(f"{ident}: citation numbers differ from paragraph ID")
                continue
            book = books[number]
            ch = book["chapters"][chapter-1]
            if any(ref[key] != ch[key] for key in ("source_member", "is_epilogue")) or ref["chapter_title"] != ch["title"] or ref["book_title"] != book["title"]:
                errors.append(f"{ident}: citation source metadata differs from inventory")
            if not 0 <= ref["word_start"] < book["word_count"] or not 1 <= ref["word_count"] <= book["word_count"] - ref["word_start"]:
                errors.append(f"{ident}: citation word offset outside book")
            pages = (ref["word_start"]//250+1, (ref["word_start"]+ref["word_count"]-1)//250+1)
            if (ref["page_start"],ref["page_end"]) != pages:
                errors.append(f"{ident}: citation page arithmetic is inconsistent")
            if ref["label"] != citation(ref):
                errors.append(f"{ident}: displayed citation label is inconsistent")
    if load_json(root / "research/coverage.json") != coverage:
        errors.append("Compiled coverage report differs from the review ledger")
    if require_complete and not coverage["complete"]:
        errors.append("Full-text review ledger is incomplete")
    if errors:
        raise ValueError("\n".join(errors))
    return {"entries":len(expected), "reviewed_paragraphs":coverage["reviewed"],
            "total_paragraphs":coverage["paragraphs"], "complete":coverage["complete"],
            "additional_text_blocks":coverage["additional_text_blocks"],
            "reviewed_additional_text_blocks":coverage["reviewed_additional_text_blocks"],
            "source_sha256":inventory["source_sha256"], "metadata_and_exports_consistent":True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--require-complete", action="store_true")
    args = parser.parse_args()
    print(json.dumps(check(args.root,args.require_complete),indent=2))


if __name__ == "__main__":
    main()
