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

## Research status

Corpus tooling is being established. A full-text extraction is not a completed
semantic review. Per-chapter reviewed ranges will record what has actually
been read; generated coverage reports will keep any remaining work visible.

## Checks

```sh
python -m unittest discover -s tests -v
nix flake check
```

No external Python packages or network services are needed to extract or query
the ebook. Nix uses the committed lockfile for its development tools.
