#!/usr/bin/env python3
"""Rank uncited descriptive paragraphs for a second-pass omission audit.

This is a noisy discovery aid, not a classifier or a claim that an uncited
paragraph belongs in the catalogue. Generic rooms, gardens, and water can
refer to places outside Hogwarts.
"""
import argparse
import json
from pathlib import Path
import re

from catalogue import ROOT, citation, paragraph_index, read_research

PATTERNS = {
    "named_school_space": re.compile(r"\b(?:Hogwarts|Great Hall|Entrance Hall|Gryffindor|Slytherin|Ravenclaw|Hufflepuff|Owlery|Forbidden Forest|Whomping Willow|Room of Requirement|North Tower|West Tower|Astronomy Tower|Hagrid.s (?:hut|cabin))\b", re.I),
    "space": re.compile(r"\b(?:castle|grounds|dungeons?|corridors?|staircase|stairs|landing|classroom|common room|dormitory|dormitories|bathroom|greenhouses?|kitchens?|lake|pitch|tunnel|passageway|tower|gate|ramparts|battlements)\b", re.I),
    "physical": re.compile(r"\b(?:walls?|ceiling|floor|windows?|doors?|stone|marble|wooden|wood.panelled|oak|iron|bronze|silver|golden|greenish|narrow|wide|circular|arched|low|high|long|small|large|vast|huge|dim|draughty|damp|torch|candles?|lamps?|curtain|tapestr|portrait|statue|mantelpiece|fireplace|roof|balcony|carpet|armchair|shelves|bookcase|table|bench|bed|grass|trees?|bushes|steps|path|cliff)\w*\b", re.I),
    "relation": re.compile(r"\b(?:above|below|beneath|behind|opposite|beside|beyond|underneath|overlooking|overlooked|at the (?:top|bottom|end)|to (?:the|his|her|their) (?:left|right)|north|south|east|west|first.floor|second.floor|third.floor|fourth.floor|fifth.floor|sixth.floor|seventh.floor)\b", re.I),
    "quantity": re.compile(r"\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty|thirty|forty|fifty|hundred)\b.{0,30}\b(?:feet|foot|yards?|inches|tables?|beds?|windows?|staircases?|doors?|floors?|towers?|steps|chairs?)\b", re.I),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=ROOT / "build/corpus.json")
    parser.add_argument("--research", type=Path, default=ROOT / "research/books")
    parser.add_argument("--output", type=Path, default=ROOT / "build/discovery-audit.json")
    parser.add_argument("--book", type=int)
    parser.add_argument("--limit", type=int, default=100)
    args = parser.parse_args()
    corpus = json.loads(args.corpus.read_text())
    cited = {ref for record in read_research(args.research) for entry in record["entries"] for ref in entry["evidence"]}
    candidates = []
    for p in paragraph_index(corpus).values():
        if p["id"] in cited or (args.book and p["book"] != args.book):
            continue
        hits = {key: len(pattern.findall(p["text"])) for key, pattern in PATTERNS.items()}
        if not (hits["named_school_space"] or hits["space"]) or hits["physical"] < 2:
            continue
        score = (min(hits["named_school_space"], 2)*4 + min(hits["space"], 3)*2 +
                 min(hits["physical"], 10) + min(hits["relation"], 3)*2 + min(hits["quantity"], 2)*3)
        candidates.append({"id": p["id"], "score": score, "signals": hits,
                           "reference": citation(p), "text": p["text"]})
    candidates.sort(key=lambda p: (-p["score"], p["id"]))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"warning": "Discovery candidates, not verified omissions. Full-text review is still required.",
                                      "source_sha256": corpus["source_sha256"],
                                      "candidates": candidates}, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(candidates)} uncited discovery candidates; showing {min(args.limit,len(candidates))}. Full report: {args.output}")
    for p in candidates[:args.limit]:
        print(f"\nScore {p['score']} · {p['reference']}\n{p['text']}")


if __name__ == "__main__":
    main()
