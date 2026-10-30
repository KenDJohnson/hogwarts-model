# Sources, citations and scope

The sole lore source is the user-supplied `Harry Potter.epub`, a British-English
Pottermore omnibus. Its SHA-256 is
`fc554e217f5ec7edc995b24de3d62f50cee929c524fa6ec5e0a7ae23a7ca2732`.
The [source inventory](../research/source-inventory.json) records each book's
title, ebook ISBN, chapter title, EPUB member, paragraph count and word count.
No film, game, wiki, architectural drawing, or author's later commentary has
been used to fill gaps in these seven novels.

## What was extracted

The seven books contain 199 narrative chapter files, including the final
epilogue: 17, 18, 22, 37, 38, 30 and 37 files respectively. The last file of
book 7 is explicitly labelled as the epilogue in the data and citations. The
complete extraction contains 38,426 nonempty paragraphs and 1,101,354
whitespace-separated words.

The omnibus also contains the next book's first chapter at the end of books
1–6. Those six previews are excluded. Their normalised paragraph text was
checked against the corresponding complete book and matched exactly, so
excluding them removes duplicates rather than unique narrative material.
Covers, contents pages, publisher material, dedications and the epigraph are
not included in the narrative reading ledger.

The parser preserves all nonempty body `<p>` text, including dialogue, songs,
letters and textual scene separators. Inline styling is discarded and
whitespace is collapsed for a stable searchable transcript. The original
archive is unchanged. The parser verifies the expected canonical chapter-file
sets rather than silently ignoring an extra or missing numbered chapter.

## How to find a passage

A paragraph ID such as `B01-C007-P0028` means book 1, chapter 7, nonempty
narrative paragraph 28. A record supplies the book title, chapter title and
number, reference page range, original EPUB member and source paragraph
ordinal. The source ordinal counts blank `<p>` elements too; it can therefore
differ from the narrative paragraph number. An original element ID is retained
when present.

This EPUB has no print-page map. Its CSS `pagebreak` paragraphs mark chapter
breaks and do not provide printed page numbers. The user selected stable EPUB
references with generated pages rather than an unspecified printed edition.

`ref250-v1` assigns 250 whitespace-separated words to each project reference
page, starting at page 1 for each book. It counts normalised nonempty narrative
paragraph text, including textual scene separators, and excludes chapter
headings and blank paragraphs. A paragraph that crosses a boundary receives
its full page range. The seven volumes produce 4,409 reference pages in total.
These numbers do not claim to match a print edition, Kindle location, Calibre
page count or e-reader screen.

The local HTML reader actually splits the source at these word boundaries.
An independent HTML parser verifies every reconstructed paragraph against the
extracted text, checks paragraph ordering, checks all page word counts, and
confirms each paragraph's page range. `catalogue.py show` relocates a paragraph
without requiring a browser. A different source ebook must not silently reuse
these references: source identity is checked against the inventory hash.

## What belongs in the catalogue

Include observations or reports that constrain the environment: shape,
material, colour, lighting, relevant sound, fixed or characteristic furniture,
decorations, portraits, statues, doors, access mechanisms, floor levels,
relative placement, routes, sightlines, dimensions, vegetation, terrain,
weather-related states, hidden spaces and magical changes. Hogwarts' station,
village approaches and passage destinations provide boundary context.

Retain separate visits when they add information or document a changed state.
An entry can combine related details from a scene and cite multiple
paragraphs. Repeated place-name mentions, ordinary movements, carried objects
and plot dialogue that adds no environmental information are not separate
descriptions. For example, a student putting a goblet on an already described
table does not imply another fixture. A description of Gringotts' underground
lake is outside scope despite matching architectural search vocabulary.

Each record contains a paraphrase, exact evidence locators, certainty, a dated
or scene-specific state and modelling notes. The local reader also exposes
the original supporting paragraphs. The ebook, complete extracted text and
full-text reader stay under Git ignores. The committed outputs contain the
research paraphrases, metadata and references.

## Evidence and completeness

The review proceeds through the full narrative, including chapters set away
from Hogwarts. A memory, letter or discussion elsewhere can still constrain
the school. Reviewers record actual paragraph ranges read for every chapter,
including chapters with no in-scope descriptions. Extraction and keyword
matching do not count as semantic reading.

The [coverage report](coverage.md) is generated from those declarations.
Validation catches missing or overlapping ranges, impossible paragraph IDs,
evidence assigned to the wrong book, inconsistent page arithmetic and stale
exports. It cannot prove that a reader recognised every relevant sentence or
that a paraphrase preserves every nuance. The catalogue is a comprehensive
research artefact with traceable evidence, not a mathematical proof of
exhaustiveness.

An additional [audit log](../research/audit-log.json) records inspection of
uncited descriptive candidates produced by `discovery_audit.py`. This noisy
heuristic helps find omissions and also exposes false positives from other
locations; it does not replace full-text review. Its recorded scope should be
read independently from the full-text coverage ledger.

## How evidence should constrain a model

`explicit` identifies narrated observation, `reported` identifies a
character's account or explanation, and `inference` identifies a deduction.
Some records combine observation and an explanation; their modelling notes
preserve that distinction. Descriptions based on what a character thinks,
guesses, remembers or claims must retain the qualification.

Relative terms such as left, right, behind and above need their scene's
viewpoint. A route through several stairs does not establish an equal number
of storeys. The level of a tower entrance need not be the level of its top
room. British ground-floor naming should remain explicit. Exact dimensions
and coordinates chosen to connect underdetermined spaces are design choices.

The [model foundation](model-foundation.md) provides selected constraints with
this purpose. Its machine-readable subject/relation/object records can seed
an adjacency graph before any meshes are built. It deliberately retains the
first-floor/second-floor Myrtle reference conflict and the changing Room of
Requirement exits. A reconstruction should expose such choices rather than
silently attributing its solution to the books.
