# Hogwarts from the seven novels

This repository is building a description catalogue and spatial reference for
a future explorable 3D model of Hogwarts and its grounds. The supplied British
English Pottermore omnibus is the source. The ebook stays local and is ignored
by Git, together with its complete extracted text.

This is an unofficial, non-commercial fan project, not affiliated with or
endorsed by J.K. Rowling, her publishers or Warner Bros. Harry Potter names and
characters belong to their owners. The repository contains no ebook or book
text: its catalogue holds paraphrases and locators.

**[Browse the catalogue](https://kendjohnson.github.io/hogwarts-model/)**

## Reproduce the corpus

```sh
nix develop
python scripts/corpus.py "Harry Potter.epub"
```

The extractor writes `build/corpus.json`, `build/inventory.json`, and one
locator-labelled text file per chapter. Only the seven books' own chapters
are included; next-book preview chapters are excluded. Book 7's last file is
the epilogue, labelled as such in metadata.

Compile the reviewed records, readable Markdown, CSV export, coverage report,
and local HTML reader:

```sh
python scripts/catalogue.py validate --require-complete
python scripts/catalogue.py build
python scripts/verify_reader.py
open build/reader/index.html
```

The HTML reader works directly from disk, with no server or external assets.
It searches the selected descriptions and source passages and links to the
complete books split into actual 250-word project reference pages. Full text
and the reader remain under ignored `build/`; committed catalogue exports
contain paraphrases and locators.

## Browse the descriptions

The [public edition](https://kendjohnson.github.io/hogwarts-model/) has a
chronological view that follows book and chapter order, and an area view that
groups descriptions by area and place. Every entry shows its paraphrase,
citation, category, evidence type, index number, dated state and model note.
From any entry, the place buttons open the other descriptions of that place
beside the list, so you keep your position; you can step through them in book
order. Search, filters and links to any entry all work too.

The Overview tab gathers what the books establish about the castle as a whole, with
a floor-by-floor table. Every area and place also opens with its own consolidated
description. The same text is in [docs/overviews/](docs/overviews/index.md) and
[overviews.json](research/overviews.json).

With your own copy of the ebook, after `catalogue.py build`, generate the local
edition. It adds the text of every cited paragraph, and each ¶ opens that
paragraph in the reader:

```sh
python scripts/build_site.py
open build/site/index.html
```

The local edition quotes about a quarter of the series, so it stays under ignored
`build/`. Keep it local: do not commit or publish `build/site/`.

`python scripts/build_site.py --public` builds the public edition into
`build/public-site/` from committed files alone. The
[Pages workflow](.github/workflows/pages.yml) runs it on every push to `master`.
That job has neither the ebook nor the extracted text, so it cannot publish them.
Both editions work directly from disk, and their source is in `web/`.

Find and inspect evidence from the command line:

```sh
python scripts/catalogue.py search 'Great Hall'
python scripts/catalogue.py search 'marble staircase' --source
python scripts/catalogue.py show B01-C007-P0001 --context 2
```

`search` is a literal case-insensitive substring query. `--source` searches the
entire extracted corpus. `show` reports the book/chapter/reference page and can
include neighbouring paragraphs. These tools assist the review; searching
alone does not count as reading a chapter.

After compiling a review, run `python scripts/discovery_audit.py --limit 30`
to rank uncited paragraphs with architectural language for a second look.
These are deliberately noisy discovery candidates, not verified omissions.
The full candidate report stays under ignored `build/`.

## Citation policy

The EPUB has no print-page map. The user selected stable EPUB references plus
generated reference pages. A citation identifies the book, chapter title and
number, paragraph ID, and project reference page(s). `ref250-v1` is a fixed
250-word pagination of each book's narrative text; it does not claim to match
any printed edition or an e-reader's screen. Paragraphs spanning a boundary
receive a page range. Chapter headings and blank paragraphs do not count.

The exact source is identified by SHA-256. Source EPUB member paths and source
paragraph ordinals provide a second locator independent of generated pages.
Non-paragraph text, including definition-list questions and table cells, has
separate `X` fragment IDs and source element/ordinal/text-slot locators. These
fragments are interleaved in document order without renumbering `P` paragraphs.
See [the research schema](research/SCHEMA.md) for inclusion and review rules.
The [methodology](docs/methodology.md) explains source coverage, duplicate
preview checks, citation limitations and the boundary between evidence and
modelling choices.

## Research status

The complete seven-book narrative has been reviewed: **199 chapter files
including the epilogue, 38,426 paragraphs and 33 additional text fragments**.
The corpus contains **1,101,442 words** and **4,410 project reference pages**.
The catalogue contains **1,443 records**. All chapter and supplementary-text
review ranges are complete. A second pass inspected **283 uncited discovery
candidates** across all seven books; its decisions are recorded in
[the audit log](research/audit-log.json).

Full-text coverage and reference validity are checked mechanically. Semantic
exhaustiveness remains a research judgement: the complete review, explicit
inclusion rules, source links and omission audit make that judgement inspectable.

The [overviews](docs/overviews/index.md) consolidate those records: 2,014 cited
facts about the castle, its 28 areas and its 131 places, labelled as explicit,
reported, inferred or estimated. Read them, and the
[generation brief](docs/generation-brief.md), before making any image or model.
The brief lists the size checks that every attempt has to meet.

The [model foundation](docs/model-foundation.md) records 62 selected
source-backed constraints, conflicts and changing states. Its editable,
machine-readable source is [model-constraints.json](research/model-constraints.json).
It is a starting constraint set rather than a unique castle plan.

Read the [full chronological catalogue](docs/catalogue.md), browse the
[cross-book area guides](docs/areas/index.md), or use the
[exact location index](docs/location-index.md). The area guides are overlapping
navigation groups, not claims that similarly named rooms are the same room.

Every record is also filed under one or more of 131 places in
[places.json](research/places.json), which is what connects descriptions of the
same place despite their scene-specific labels. Each place belongs to one of 28
areas, and that is the only source of area membership. A place marked as a group
gathers similar locations without claiming they are one room.
See [the research schema](research/SCHEMA.md#places-and-areas).

## Checks

```sh
python -m unittest discover -s tests -v
python scripts/check_research.py --require-complete
nix flake check
```

No external Python packages or network services are needed to extract or query
the ebook. Nix uses the committed lockfile for its development tools.

`node tests/site_smoke.mjs` drives both built editions in headless Chrome from
their `file://` URLs, with real clicks and key presses, and writes screenshots to
`build/site-screens/`. It needs the ebook-derived build, Node and a local
Chrome, so it runs on demand and is not part of `nix flake check`. Set `CHROME`
to use another Chrome binary, and `PUBLIC_SITE` to check the published edition at
its URL.

`nix flake check` runs tool tests and validates the committed evidence bounds,
source identity, review ledger, page arithmetic and generated JSON export
without needing the ebook. A full source rebuild plus `verify_reader.py`
checks the underlying text and page boundaries. A structurally valid ledger
does not prove that every relevant description has been recognised; the
second-pass audit records its own scope separately.
