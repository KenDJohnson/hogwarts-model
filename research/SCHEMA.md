# Research record contract

The supplied EPUB is the sole canon source for this project. Review the entire
text, including memories, dialogue, journeys, changed rooms, and battle damage.
Films, games, wiki maps, and remembered details are not evidence.

`research/books/book-NN.json` is a JSON object with `book` (integer), `entries`
(array), and `chapter_reviews` (array). Every entry has these fields:

```json
{
  "id": "B01-001",
  "location": "Great Hall",
  "category": "interior",
  "description": "A precise paraphrase of the physical or spatial observation.",
  "evidence": ["B01-C007-P0001"],
  "certainty": "explicit",
  "temporal": "1991 arrival",
  "model_notes": "What this establishes, and any ambiguity in translating it to geometry."
}
```

The example locator illustrates syntax; it is not a claim about that paragraph.

Categories: `exterior`, `interior`, `grounds`, `route`, `furnishing`, `magic`,
`temporary`, `history`. Certainty: `explicit` (narrated observation), `reported`
(a character's statement, legend, or explanation), `inference` (a deduction
which must be explained in `model_notes`). Evidence may include multiple
paragraphs; cite each needed supporting paragraph, not a guessed range. A
description can combine a contiguous scene's related facts. Preserve separate
visits when they add a new constraint or document a changed state.

Scope includes: structure, material, colour, light, sound relevant to the space,
fixtures, furniture, portrait subjects/positions, statues, doors, staircases,
classrooms and offices, dormitories/common rooms, kitchens, underground spaces,
access rules, floor levels, travel sequences, lines of sight, dimensions,
grounds, vegetation, lakeshore and underwater terrain, forest, gates, perimeter,
nearby Hogsmeade and station access, tunnels and destinations. Include seasonal
decoration, tournament installations, and wartime damage as dated states. Do
not catalogue every character movement or object carried through a room if it
adds no environmental fact. Nearby settlements matter principally as boundary
context and passage destinations; this is not an inventory of all wizarding
Britain.

`chapter_reviews` must account for every narrative paragraph (including
chapters with no relevant descriptions):

```json
{
  "chapter": 1,
  "reviewed_ranges": [[1, 200]],
  "method": "full-text paragraph review",
  "notes": "Scope decisions or passages needing another look."
}
```

Only record ranges actually read. A search hit or running the extractor is not
a semantic review. Never mark an unread range reviewed. If context/time limits
prevent completion, save completed ranges and identify remaining work plainly.

Page numbers are computed by the tools; do not type or invent them. `ref250-v1`
uses 250 whitespace-separated narrative words per reference page, resets at
each book, excludes chapter headings and blank paragraphs, and allows a
paragraph to span pages. These are project reference pages, not print or
e-reader screen pages. The corpus also retains the EPUB member and the source
paragraph ordinal (counting blank `<p>` elements) for exact relocation.

Additional non-paragraph narrative fragments use `X` IDs, for example
`B02-C006-X0001`. These cover text in definition lists and tables that is not
inside a `<p>`. Each retains its source element tag, ordinal among that tag in
the chapter body, and `text`/`tail` slot. They count in document order for
pagination while existing `P` IDs remain unchanged. Their completed reviews
are recorded separately under the book object's `extra_reviews` array:

```json
{
  "id": "B02-C006-X0001",
  "method": "full-text review of additional non-paragraph fragment",
  "notes": "Read the complete quiz prompt; no physical or spatial description."
}
```

Complete coverage requires all ordinary paragraph ranges and all additional
fragments to have been read. `extra_blocks` in the source inventory contains
metadata only; the complete extracted text remains ignored.
