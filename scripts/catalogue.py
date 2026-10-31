#!/usr/bin/env python3
"""Validate, compile, and search the manually reviewed Hogwarts evidence."""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
import html
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {"exterior", "interior", "grounds", "route", "furnishing", "magic", "temporary", "history"}
CERTAINTIES = {"explicit", "reported", "inference"}
PLACE_KINDS = {"place", "group"}
REQUIRED = {"id", "location", "category", "description", "evidence", "certainty", "temporal", "model_notes"}


def load_json(path: Path):
    return json.loads(path.read_text())


def chapter_blocks(chapter: dict) -> list:
    return sorted(chapter["paragraphs"] + chapter.get("extra_blocks", []),
                  key=lambda p: p.get("source_order", p["paragraph"] or 0))


def paragraph_index(corpus: dict) -> dict:
    return {
        p["id"]: {**p, "book": book["number"], "book_title": book["title"],
                  "chapter": chapter["number"], "chapter_title": chapter["title"],
                  "is_epilogue": chapter["is_epilogue"], "source_member": chapter["source_member"]}
        for book in corpus["books"] for chapter in book["chapters"] for p in chapter_blocks(chapter)
    }


def read_research(folder: Path) -> list:
    return [load_json(p) for p in sorted(folder.glob("book-*.json"))]


def validate(corpus: dict, research: list) -> tuple[list[str], dict]:
    """Check IDs, source ownership, review ranges, and actual chapter coverage."""
    paragraphs = paragraph_index(corpus)
    books = {b["number"]: b for b in corpus["books"]}
    errors = []
    seen_books, seen_entries = set(), set()
    reviewed = defaultdict(set)
    reviewed_extras = set()
    entry_counts = Counter()
    for record in research:
        number = record.get("book")
        if number not in books or number in seen_books:
            errors.append(f"Invalid or duplicate book: {number}")
            continue
        seen_books.add(number)
        chapters = {ch["number"]: ch for ch in books[number]["chapters"]}
        for review in record.get("extra_reviews", []):
            ident = review.get("id")
            if ident not in paragraphs or not paragraphs[ident].get("is_extra") or paragraphs[ident]["book"] != number:
                errors.append(f"Book {number}: invalid additional-text review {ident}")
            elif ident in reviewed_extras:
                errors.append(f"Book {number}: duplicate additional-text review {ident}")
            elif not review.get("method") or not review.get("notes"):
                errors.append(f"{ident}: missing additional-text review method/notes")
            else:
                reviewed_extras.add(ident)
        for entry in record.get("entries", []):
            ident = entry.get("id", "<missing>")
            if REQUIRED - entry.keys():
                errors.append(f"{ident}: missing fields {sorted(REQUIRED - entry.keys())}")
                continue
            if not re.fullmatch(fr"B{number:02d}-\d{{3,}}", ident) or ident in seen_entries:
                errors.append(f"{ident}: invalid or duplicate entry ID")
            seen_entries.add(ident)
            for field in ("location", "description", "temporal", "model_notes"):
                if not isinstance(entry[field], str) or not entry[field].strip():
                    errors.append(f"{ident}: {field} must be nonempty text")
            if entry["category"] not in CATEGORIES:
                errors.append(f"{ident}: unknown category {entry['category']}")
            if entry["certainty"] not in CERTAINTIES:
                errors.append(f"{ident}: unknown certainty {entry['certainty']}")
            if not isinstance(entry["evidence"], list) or not entry["evidence"]:
                errors.append(f"{ident}: evidence must be a nonempty array")
                continue
            if len(set(entry["evidence"])) != len(entry["evidence"]):
                errors.append(f"{ident}: duplicate evidence paragraph")
            for ref in entry["evidence"]:
                if ref not in paragraphs:
                    errors.append(f"{ident}: nonexistent evidence {ref}")
                elif paragraphs[ref]["book"] != number:
                    errors.append(f"{ident}: evidence from another book {ref}")
            entry_counts[number] += 1
        seen_chapters = set()
        for review in record.get("chapter_reviews", []):
            chapter = review.get("chapter")
            if chapter not in chapters or chapter in seen_chapters:
                errors.append(f"Book {number}: invalid or duplicate reviewed chapter {chapter}")
                continue
            seen_chapters.add(chapter)
            if not review.get("method") or not isinstance(review.get("notes"), str):
                errors.append(f"Book {number}, chapter {chapter}: missing review method/notes")
            count = len(chapters[chapter]["paragraphs"])
            for span in review.get("reviewed_ranges", []):
                if not isinstance(span, list) or len(span) != 2 or not all(type(n) is int for n in span):
                    errors.append(f"Book {number}, chapter {chapter}: invalid range {span}")
                    continue
                start, end = span
                if not 1 <= start <= end <= count:
                    errors.append(f"Book {number}, chapter {chapter}: out-of-bounds range {span}, max {count}")
                    continue
                numbers = set(range(start, end + 1))
                if numbers & reviewed[number, chapter]:
                    errors.append(f"Book {number}, chapter {chapter}: overlapping review ranges")
                reviewed[number, chapter].update(numbers)
    coverage = []
    for number, book in books.items():
        chapter_reports = []
        for ch in book["chapters"]:
            count = len(ch["paragraphs"])
            missing = sorted(set(range(1, count + 1)) - reviewed[number, ch["number"]])
            spans = []
            for value in missing:
                if spans and spans[-1][1] + 1 == value:
                    spans[-1][1] = value
                else:
                    spans.append([value, value])
            chapter_reports.append({"chapter": ch["number"], "title": ch["title"],
                                    "paragraphs": count, "reviewed": count - len(missing),
                                    "unread_ranges": spans,
                                    "additional_text_blocks": len(ch.get("extra_blocks", [])),
                                    "reviewed_additional_text_blocks": sum(p["id"] in reviewed_extras for p in ch.get("extra_blocks", [])),
                                    "unread_extra_blocks": [p["id"] for p in ch.get("extra_blocks", []) if p["id"] not in reviewed_extras]})
        coverage.append({"book": number, "title": book["title"], "entries": entry_counts[number],
                         "paragraphs": sum(ch["paragraphs"] for ch in chapter_reports),
                         "reviewed": sum(ch["reviewed"] for ch in chapter_reports),
                         "additional_text_blocks": sum(ch["additional_text_blocks"] for ch in chapter_reports),
                         "reviewed_additional_text_blocks": sum(ch["reviewed_additional_text_blocks"] for ch in chapter_reports),
                         "chapters": chapter_reports})
    total = sum(b["paragraphs"] for b in coverage)
    count = sum(b["reviewed"] for b in coverage)
    extras = sum(b["additional_text_blocks"] for b in coverage)
    return errors, {"source_sha256": corpus["source_sha256"], "paragraphs": total,
                    "reviewed": count, "additional_text_blocks": extras,
                    "reviewed_additional_text_blocks": len(reviewed_extras),
                    "complete": count == total and len(reviewed_extras) == extras,
                    "entries": sum(entry_counts.values()), "books": coverage}


def citation(p: dict) -> str:
    chapter = "Epilogue" if p["is_epilogue"] else f"ch. {p['chapter']}"
    pages = str(p["page_start"])
    if p["page_end"] != p["page_start"]:
        pages += f"–{p['page_end']}"
    location = f"extra fragment {int(p['id'].split('-X')[1])}" if p.get("is_extra") else f"¶{p['paragraph']}"
    return f"Book {p['book']}, {chapter}, “{p['chapter_title']}”, ref p. {pages}, {location} ({p['id']})"


def compile_catalogue(corpus: dict, research: list) -> dict:
    index = paragraph_index(corpus)
    records = []
    for book in research:
        for entry in book["entries"]:
            citations = []
            for ref in entry["evidence"]:
                p = index[ref]
                citations.append({key: p[key] for key in (
                    "id", "book", "book_title", "chapter", "chapter_title", "is_epilogue",
                    "paragraph", "page_start", "page_end", "source_member", "source_p_ordinal",
                    "source_element_id", "word_start", "word_count"
                )} | {"label": citation(p), "is_extra": p.get("is_extra", False),
                      "source_element_tag": p.get("source_element_tag", "p"),
                      "source_element_ordinal": p.get("source_element_ordinal", p["source_p_ordinal"]),
                      "source_text_slot": p.get("source_text_slot", "text")})
            records.append({**entry, "citations": citations})
    records.sort(key=lambda entry: (index[entry["evidence"][0]]["book"], index[entry["evidence"][0]]["word_start"], entry["id"]))
    return {"schema_version": 1, "source_sha256": corpus["source_sha256"],
            "pagination": corpus["pagination"], "entries": records}


def write_markdown(catalogue: dict, coverage: dict, folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    lines = ["# Hogwarts description catalogue", "",
             f"{coverage['entries']} reviewed description records. "
             f"Reading ledger: {coverage['reviewed']:,}/{coverage['paragraphs']:,} paragraphs "
             f"plus {coverage['reviewed_additional_text_blocks']}/{coverage['additional_text_blocks']} additional text fragments.", "",
             "All pages below are **project reference pages (ref250-v1, 250 words)**, not print pages. "
             "Book titles and exact source paths are in the machine-readable catalogue. "
             "Rebuild the local reader to open source-text links.", "",
             "[Location index](location-index.md) · [Coverage and unread ranges](coverage.md)", ""]
    if not coverage["complete"]:
        lines += ["**Review in progress. This catalogue is not complete.**", ""]
    grouped = defaultdict(list)
    for entry in catalogue["entries"]:
        grouped[entry["citations"][0]["book"]].append(entry)
    for book in coverage["books"]:
        lines += [f"## Book {book['book']}: {book['title']}", ""]
        for entry in grouped[book["book"]]:
            lines += [f"<a id=\"{entry['id'].lower()}\"></a>",
                      f"### {entry['id']} · {entry['location']}", "",
                      entry["description"], "",
                      f"- Category: {entry['category']}; evidence: {entry['certainty']}; state: {entry['temporal']}.",
                      f"- Model: {entry['model_notes']}"]
            for p in entry["citations"]:
                lines.append(f"- [{p['label']}](../build/reader/book-{p['book']:02d}.html#{p['id']})")
            lines.append("")
    (folder / "catalogue.md").write_text("\n".join(lines).rstrip() + "\n")
    locations = defaultdict(list)
    for entry in catalogue["entries"]:
        locations[entry["location"]].append(entry)
    lines = ["# Location index", "", "Labels preserve the reviewers' distinctions; unnamed rooms are not silently merged.", ""]
    for location, entries in sorted(locations.items(), key=lambda kv: kv[0].casefold()):
        links = ", ".join(f"[{e['id']}](catalogue.md#{e['id'].lower()})" for e in entries)
        lines += [f"## {location}", "", links, ""]
    (folder / "location-index.md").write_text("\n".join(lines).rstrip() + "\n")
    lines = ["# Full-text review coverage", "",
             "This reports the reviewers' declared reading ranges. Structural validation checks "
             "that those ranges cover the corpus; it cannot prove semantic completeness or that "
             "every description has been captured.", "",
             f"Reviewed: **{coverage['reviewed']:,}/{coverage['paragraphs']:,} paragraphs**. "
             f"Additional text fragments: **{coverage['reviewed_additional_text_blocks']}/{coverage['additional_text_blocks']}**. "
             f"Records: **{coverage['entries']}**.", ""]
    for book in coverage["books"]:
        lines += [f"## Book {book['book']}: {book['title']}", "",
                  f"{book['reviewed']:,}/{book['paragraphs']:,} paragraphs; {book['entries']} records.", ""]
        for ch in book["chapters"]:
            status = "Reviewed" if not ch["unread_ranges"] else "Unread: " + ", ".join(f"¶{a}–{b}" for a,b in ch["unread_ranges"])
            extra = f"; extra fragments {ch['reviewed_additional_text_blocks']}/{ch['additional_text_blocks']}" if ch["additional_text_blocks"] else ""
            if ch["unread_extra_blocks"]:
                extra += "; unread " + ", ".join(ch["unread_extra_blocks"])
            lines.append(f"- Chapter {ch['chapter']}, {ch['title']}: {status} ({ch['reviewed']}/{ch['paragraphs']}{extra}).")
        lines.append("")
    (folder / "coverage.md").write_text("\n".join(lines).rstrip() + "\n")


STYLE = """body{font:17px/1.65 system-ui,sans-serif;max-width:1040px;margin:2em auto;padding:0 1em;color:#20242a;background:#faf8f1}a{color:#164e78}input,select,button{font:inherit;padding:.45em}input{width:65%;max-width:650px}article,.page{border-top:1px solid #bbb;margin-top:1.5em;padding-top:.5em}.meta{color:#59616c;font-size:.85em}.source{border-left:3px solid #a89778;padding-left:1em;white-space:pre-wrap}.continuation{color:#777;font-size:.8em}:target{background:#fff0ae}nav{position:sticky;top:0;background:#faf8f1;padding:.5em 0}h1,h2,h3{line-height:1.25}details{margin:.5em 0}.ref{font-size:.8em;display:block;color:#6b6251}@media print{nav,input,select,button{display:none}.page{break-before:page}}"""


def write_reader(corpus: dict, catalogue: dict, folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    index = paragraph_index(corpus)
    for book in corpus["books"]:
        parts = [f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(book["title"])} — reference reader</title><style>{STYLE}</style>',
                 '<a href="index.html">Catalogue search</a>', f'<h1>{html.escape(book["title"])}</h1>',
                 '<p>Project reference pages, ref250-v1: 250 narrative words per page. These are not print pages. Paragraph IDs and EPUB source ordinals identify the original text.</p>',
                 '<nav>Reference page <input id="page" type="number" min="1" style="width:7em"><button onclick="location.hash=\'page-\'+document.getElementById(\'page\').value">Go</button></nav>']
        current_page = 0
        for chapter in book["chapters"]:
            for block_ordinal, p in enumerate(chapter_blocks(chapter)):
                words = p["text"].split()
                consumed = 0
                while consumed < len(words):
                    offset = p["word_start"] + consumed
                    page = offset // 250 + 1
                    take = min(250 - offset % 250, len(words) - consumed)
                    if page != current_page:
                        if current_page:
                            parts.append('</section>')
                        parts.append(f'<section class="page" id="page-{page}"><h2>Reference page {page}</h2>')
                        current_page = page
                    if consumed == 0 and block_ordinal == 0:
                        parts.append(f'<h3 id="chapter-{chapter["number"]}">{"Epilogue" if chapter["is_epilogue"] else "Chapter " + str(chapter["number"])}: {html.escape(chapter["title"])}</h3>')
                    ident = p["id"] if consumed == 0 else f"{p['id']}--page-{page}"
                    tag = p.get("source_element_tag", "p")
                    ordinal = p.get("source_element_ordinal", p["source_p_ordinal"])
                    source = f'{chapter["source_member"]} · source {tag}[{ordinal}] ({p.get("source_text_slot", "text")})'
                    parts.append(f'<p id="{ident}" title="{html.escape(source, quote=True)}"><a class="ref" href="#{p["id"]}">{p["id"]}{" (continued)" if consumed else ""}</a>{html.escape(" ".join(words[consumed:consumed+take]))}</p>')
                    consumed += take
        parts.append('</section></html>')
        (folder / f"book-{book['number']:02d}.html").write_text("\n".join(parts))
    records = []
    for entry in catalogue["entries"]:
        records.append({**entry, "source_text": [index[ref]["text"] for ref in entry["evidence"]]})
    data = json.dumps(records, ensure_ascii=False).replace("</", "<\\/")
    page = f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hogwarts evidence catalogue</title><style>{STYLE}</style>
<h1>Hogwarts evidence catalogue</h1><p>Search descriptions, places, model notes, and source passages. All pages are generated ref250-v1 pages, not printed pages.</p>
<nav><input id="query" placeholder="Search, e.g. staircase, lake, seventh floor" aria-label="Search"><select id="book" aria-label="Book"><option value="">All books</option>{''.join(f'<option value="{b}">Book {b}</option>' for b in range(1,8))}</select><div><button id="previous">Previous 100</button> <button id="next">Next 100</button></div></nav><p id="count"></p><main id="results"></main>
<script id="data" type="application/json">{data}</script><script>
const entries=JSON.parse(document.getElementById('data').textContent);
const main=document.getElementById('results');
let offset=0;
function element(tag,text,parent,cls){{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;if(parent)parent.append(e);return e;}}
function render(){{const q=document.getElementById('query').value.toLocaleLowerCase();const book=document.getElementById('book').value;
 const matches=entries.filter(e=>(!book||e.citations[0].book===Number(book))&&JSON.stringify(e).toLocaleLowerCase().includes(q));
 document.getElementById('count').textContent=matches.length+' matching records'+(matches.length?'; showing '+(offset+1)+'–'+Math.min(offset+100,matches.length):'')+'.';
 document.getElementById('previous').disabled=offset===0;document.getElementById('next').disabled=offset+100>=matches.length;main.replaceChildren();
 for(const e of matches.slice(offset,offset+100)){{const a=element('article','',main);a.id=e.id;element('h2',e.id+' · '+e.location,a);element('p',e.description,a);element('p',e.category+' · '+e.certainty+' · '+e.temporal,a,'meta');element('p','Model: '+e.model_notes,a);
 const detail=element('details','',a);element('summary','Evidence and source passages',detail);
 e.citations.forEach((c,i)=>{{const p=element('p','',detail);const link=element('a',c.label,p);link.href='book-'+String(c.book).padStart(2,'0')+'.html#'+c.id;element('p',c.source_member+' · source '+c.source_element_tag+'['+c.source_element_ordinal+'] ('+c.source_text_slot+')',detail,'meta');element('blockquote',e.source_text[i],detail,'source');}});
 }} }}
function reset(){{offset=0;render();}}
document.getElementById('query').addEventListener('input',reset);document.getElementById('book').addEventListener('change',reset);
document.getElementById('previous').addEventListener('click',()=>{{offset=Math.max(0,offset-100);render();}});document.getElementById('next').addEventListener('click',()=>{{offset+=100;render();}});render();
</script></html>'''
    (folder / "index.html").write_text(page)


def validate_model_constraints(corpus: dict, model: dict) -> list[str]:
    index = paragraph_index(corpus)
    errors = []
    seen = set()
    fields = {"id", "group", "subject", "relation", "object", "description", "certainty", "temporal", "evidence", "model_notes"}
    for constraint in model.get("constraints", []):
        ident = constraint.get("id", "<missing>")
        if not re.fullmatch(r"M\d{3,}", ident) or ident in seen:
            errors.append(f"{ident}: invalid or duplicate model constraint")
        seen.add(ident)
        if fields - constraint.keys():
            errors.append(f"{ident}: missing model constraint fields")
            continue
        if constraint["certainty"] not in CERTAINTIES:
            errors.append(f"{ident}: unknown model certainty")
        if not constraint["evidence"]:
            errors.append(f"{ident}: model constraint has no evidence")
        for ref in constraint["evidence"]:
            if ref not in index:
                errors.append(f"{ident}: nonexistent model evidence {ref}")
    return errors


def write_model_guide(corpus: dict, model: dict, destination: Path) -> None:
    index = paragraph_index(corpus)
    lines = ["# Source-backed foundation for a Hogwarts model", "",
             "This is a selected set of constraints to guide an initial blockout, not a complete "
             "floor plan. The [description catalogue](catalogue.md) supplies the broader evidence. "
             "All pages are generated project reference pages, ref250-v1.", "",
             "## Working method", "",
             "Build an adjacency and access graph before fixing coordinates. Keep each room, "
             "route and fixture linked to its evidence. Fit dimensions only where the text "
             "supplies them; label other dimensions as design choices. A plausible reconstruction "
             "can satisfy the text without being uniquely determined by it.", "",
             "Use separate temporal states for school years, tournament arrangements, changing "
             "teachers' furnishings, Christmas and other decorations, access restrictions and "
             "wartime damage. Give the Room of Requirement requested interiors and exits. "
             "Represent conditional stair and door behaviour as rules on connections, with "
             "ordinary traversable geometry for each active state.", "",
             "Treat named compass directions and floor levels as local constraints with a source, "
             "not permission to fill in an entire map. Distinguish British ground-floor numbering, "
             "the floor of an entrance and the levels occupied by a tower. A staircase count is "
             "not a storey count. Screen adaptations are not additional evidence for this project.", "",
             "## Questions the reconstruction must keep open", "",
             "- Exact castle footprint, tower diameters and heights, most room dimensions and corridor lengths.",
             "- Complete site orientation, lake shape, terrain contours and the geometry of unmeasured routes.",
             "- Locations and destinations of secret passages not individually identified by the text.",
             "- Interiors of rooms that are mentioned without being described in the reviewed evidence.",
             "- How to implement conflicting floor references without presenting the chosen repair as canon.", ""]
    lines += ["The full review's reconciliation notes cover additional state and route details: "
              "[books 1–3](../research/notes/books-1-2-3.md), "
              "[books 4–5](../research/notes/books-4-5.md), and "
              "[books 6–7](../research/notes/books-6-7.md).", ""]
    current_group = None
    for constraint in model["constraints"]:
        if constraint["group"] != current_group:
            current_group = constraint["group"]
            lines += [f"## {current_group}", ""]
        lines += [f"### {constraint['id']}: {constraint['subject']}", "", constraint["description"], "",
                  f"Relation: `{constraint['subject']}` → `{constraint['relation']}` → `{constraint['object']}`.", "",
                  f"Evidence: {constraint['certainty']}; state: {constraint['temporal']}.", "",
                  f"Model implication: {constraint['model_notes']}", ""]
        for ref in constraint["evidence"]:
            p = index[ref]
            lines.append(f"- [{citation(p)}](../build/reader/book-{p['book']:02d}.html#{ref})")
        lines.append("")
    destination.write_text("\n".join(lines).rstrip() + "\n")


def validate_places(entry_ids: set, places: dict, area_config: dict) -> list[str]:
    """Check the navigation layer: every place has an area, every record a place."""
    errors = []
    areas = {area["id"] for area in area_config["areas"]}
    known = set()
    for place in places["places"]:
        ident = place.get("id", "<missing>")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", ident) or ident in known:
            errors.append(f"{ident}: invalid or duplicate place ID")
        known.add(ident)
        if place.get("area") not in areas:
            errors.append(f"{ident}: unknown area {place.get('area')}")
        if place.get("kind") not in PLACE_KINDS:
            errors.append(f"{ident}: unknown place kind {place.get('kind')}")
        if not place.get("title") or not place.get("scope"):
            errors.append(f"{ident}: place needs a title and scope")
    assignments = places["assignments"]
    for ident in sorted(entry_ids - assignments.keys()):
        errors.append(f"{ident}: record has no place")
    for ident in sorted(assignments.keys() - entry_ids):
        errors.append(f"{ident}: place assignment for unknown record")
    used = set()
    for ident, assigned in assignments.items():
        if not 1 <= len(assigned) <= 4 or len(set(assigned)) != len(assigned):
            errors.append(f"{ident}: needs one to four distinct places")
        for place in assigned:
            if place not in known:
                errors.append(f"{ident}: unknown place {place}")
        used.update(assigned)
    for ident in sorted(known - used):
        errors.append(f"{ident}: place has no records")
    return errors


def assign_places(catalogue: dict, places: dict) -> None:
    """Attach each record's places, and the areas those places belong to."""
    areas = {place["id"]: place["area"] for place in places["places"]}
    for entry in catalogue["entries"]:
        entry["places"] = places["assignments"][entry["id"]]
        entry["areas"] = list(dict.fromkeys(areas[place] for place in entry["places"]))


def write_area_pages(catalogue: dict, area_config: dict, places: dict, folder: Path) -> None:
    """Provide overlapping cross-book navigation without merging room identities."""
    folder.mkdir(parents=True, exist_ok=True)
    titles = {place["id"]: place["title"] for place in places["places"]}
    groups = {area["id"]: [] for area in area_config["areas"]}
    for entry in catalogue["entries"]:
        for ident in entry["areas"]:
            groups[ident].append(entry)
    index_lines = ["# Browse descriptions by area", "",
                   "These overlapping navigation groups gather records across all seven books. "
                   "A record joins an area through the places assigned to it in "
                   "[places.json](../../research/places.json); this does not assert room identity "
                   "or adjacency. The exact-label [location index](../location-index.md) and full "
                   "[chronological catalogue](../catalogue.md) remain available.", ""]
    for area in area_config["areas"]:
        entries = groups[area["id"]]
        index_lines.append(f"- [{area['title']}]({area['id']}.md): {len(entries)} records.")
        lines = [f"# {area['title']}", "", "[All areas](index.md) · [Full catalogue](../catalogue.md)", "",
                 "All pages are project reference pages, ref250-v1. Group membership is a "
                 "navigation aid; retain each record's certainty and dated state.", ""]
        for entry in entries:
            lines += [f"## {entry['id']}: {entry['location']}", "", entry["description"], "",
                      f"Places: {', '.join(titles[place] for place in entry['places'])}.", "",
                      f"Evidence: {entry['certainty']}; state: {entry['temporal']}.", "",
                      f"Model: {entry['model_notes']}", ""]
            for p in entry["citations"]:
                lines.append(f"- [{p['label']}](../../build/reader/book-{p['book']:02d}.html#{p['id']})")
            lines.append("")
        (folder / f"{area['id']}.md").write_text("\n".join(lines).rstrip() + "\n")
    (folder / "index.md").write_text("\n".join(index_lines).rstrip() + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=ROOT / "build/corpus.json")
    parser.add_argument("--research", type=Path, default=ROOT / "research/books")
    sub = parser.add_subparsers(dest="command", required=True)
    check = sub.add_parser("validate")
    check.add_argument("--require-complete", action="store_true")
    build = sub.add_parser("build")
    build.add_argument("--docs", type=Path, default=ROOT / "docs")
    build.add_argument("--reader", type=Path, default=ROOT / "build/reader")
    build.add_argument("--output", type=Path, default=ROOT / "research/catalogue.json")
    search = sub.add_parser("search")
    search.add_argument("query")
    search.add_argument("--book", type=int)
    search.add_argument("--source", action="store_true", help="Search full source text instead of research records")
    show = sub.add_parser("show")
    show.add_argument("paragraph_id")
    show.add_argument("--context", type=int, default=0)
    args = parser.parse_args()
    corpus = load_json(args.corpus)
    inventory = load_json(ROOT / "research/source-inventory.json")
    if corpus["source_sha256"] != inventory["source_sha256"]:
        parser.error("Corpus source hash differs from the reviewed source inventory")
    if args.command == "show":
        index = paragraph_index(corpus)
        if args.paragraph_id not in index:
            parser.error("Unknown paragraph ID")
        target = index[args.paragraph_id]
        for p in index.values():
            if p["book"] == target["book"] and p["chapter"] == target["chapter"] and abs(p.get("source_order",p["paragraph"] or 0) - target.get("source_order",target["paragraph"] or 0)) <= args.context:
                print(citation(p) + "\n" + p["text"] + "\n")
        return
    if args.command == "search" and args.source:
        for p in paragraph_index(corpus).values():
            if (not args.book or p["book"] == args.book) and args.query.casefold() in p["text"].casefold():
                print(citation(p) + "\n" + p["text"] + "\n")
        return
    research = read_research(args.research)
    errors, coverage = validate(corpus, research)
    model_path = ROOT / "research/model-constraints.json"
    model = load_json(model_path) if model_path.exists() else {"constraints": []}
    errors.extend(validate_model_constraints(corpus, model))
    places = load_json(ROOT / "research/places.json")
    area_config = load_json(ROOT / "research/areas.json")
    errors.extend(validate_places({entry["id"] for book in research for entry in book["entries"]}, places, area_config))
    for error in errors:
        print(error, file=sys.stderr)
    if errors:
        raise SystemExit(1)
    if args.command == "validate":
        print(json.dumps({k:v for k,v in coverage.items() if k != "books"}, indent=2))
        if args.require_complete and not coverage["complete"]:
            raise SystemExit(2)
        return
    catalogue = compile_catalogue(corpus, research)
    assign_places(catalogue, places)
    if args.command == "search":
        for entry in catalogue["entries"]:
            if (not args.book or entry["citations"][0]["book"] == args.book) and args.query.casefold() in json.dumps(entry, ensure_ascii=False).casefold():
                print(f"{entry['id']} · {entry['location']}\n{entry['description']}")
                print("\n".join(c["label"] for c in entry["citations"]) + "\n")
        return
    write_area_pages(catalogue, area_config, places, args.docs / "areas")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n")
    (args.output.parent / "coverage.json").write_text(json.dumps(coverage, ensure_ascii=False, indent=2) + "\n")
    write_markdown(catalogue, coverage, args.docs)
    write_model_guide(corpus, model, args.docs / "model-foundation.md")
    write_reader(corpus, catalogue, args.reader)
    with (args.output.parent / "catalogue.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["id", "book", "book_title", "location", "category", "description", "certainty", "temporal", "model_notes", "references"], lineterminator="\n")
        writer.writeheader()
        for entry in catalogue["entries"]:
            writer.writerow({k:entry[k] for k in writer.fieldnames if k not in {"references", "book", "book_title"}} |
                            {"book": entry["citations"][0]["book"], "book_title": entry["citations"][0]["book_title"],
                             "references": " | ".join(c["label"] for c in entry["citations"])})
    print(f"Built {len(catalogue['entries'])} records; reviewed {coverage['reviewed']}/{coverage['paragraphs']} paragraphs. Reader: {args.reader / 'index.html'}")


if __name__ == "__main__":
    main()
