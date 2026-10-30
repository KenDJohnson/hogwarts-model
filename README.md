# Hogwarts from the seven novels

This repository is building a description catalogue and spatial reference for
a future explorable 3D model of Hogwarts and its grounds. The supplied British
English Pottermore omnibus is the source. The ebook stays local and is ignored
by Git, together with its complete extracted text.

## Reproduce the corpus

```sh
nix develop
python scripts/corpus.py "Harry Potter.epub"
```

The extractor writes `build/corpus.json`, `build/inventory.json`, and one
paragraph-labelled text file per chapter. Only the seven books' own chapters
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
See [the research schema](research/SCHEMA.md) for inclusion and review rules.
The [methodology](docs/methodology.md) explains source coverage, duplicate
preview checks, citation limitations and the boundary between evidence and
modelling choices.

## Research status

Extraction, citation, search and reader tooling are validated. A full-text
extraction is not a completed semantic review. Per-chapter reviewed ranges
record what has actually been read; generated coverage reports keep remaining
work visible. The full seven-book semantic review is in progress.

The [model foundation](docs/model-foundation.md) already records selected
source-backed relationships and a floor-reference conflict. Its editable,
machine-readable source is [model-constraints.json](research/model-constraints.json).
It is a starting constraint set rather than a unique castle plan.

Read the [full chronological catalogue](docs/catalogue.md), browse the
[cross-book area guides](docs/areas/index.md), or use the
[exact location index](docs/location-index.md). The area guides are overlapping
navigation groups, not claims that similarly named rooms are the same room.

## Checks

```sh
python -m unittest discover -s tests -v
python scripts/check_research.py
nix flake check
```

No external Python packages or network services are needed to extract or query
the ebook. Nix uses the committed lockfile for its development tools.

`nix flake check` runs tool tests and validates the committed evidence bounds,
source identity, review ledger, page arithmetic and generated JSON export
without needing the ebook. A full source rebuild plus `verify_reader.py`
checks the underlying text and page boundaries. A structurally valid ledger
does not prove that every relevant description has been recognised; the
second-pass audit records its own scope separately.
