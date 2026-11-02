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

## Places and areas

`research/places.json` is the navigation layer. It answers "what else describes
this place?", which exact labels cannot: almost every label is unique to its
scene. It is not evidence, and it never changes a record.

`places` lists each place with `id`, `title`, `area`, `kind` and `scope`.
`assignments` maps every record ID to one to four place IDs, most central
first. The first is the record's main subject; later ones are places the record
also describes, such as the far end of a route.

`kind` is `place` when the text treats the location as one place across its
states, memories and damage, and `group` when it gathers similar locations or a
school-wide subject. A group must not be read as a claim of identity. Unnamed
rooms go in a group rather than a likely named room.

Each place belongs to one area in `research/areas.json`. A record's `areas` in
the compiled catalogue are derived from its places, so areas overlap and do not
assert identity or adjacency.

## Overviews

`research/overviews.json` holds the consolidated top-level descriptions: `castle`,
`areas` (each area of two or more places) and `places` (all of them). Each has a prose
`summary` and a list of `facts`, with optional `conflicts` and `open` questions. The
castle overview also has `conventions` and a floor-by-floor `levels` table.

```json
{
  "aspect": "scale",
  "text": "A short consolidated statement in original wording.",
  "certainty": "estimate",
  "records": ["B01-073"],
  "because": "Required for inference and estimate: the reasoning, or the arithmetic and its assumption."
}
```

Aspects: `scale` (size, counts, capacity, comparisons), `location` (floor, wing,
neighbours, views), `form` (shape, structure, materials), `access` (routes, doors,
rules), `contents` (furniture, fixtures, decoration) and `changes` (dated states,
damage, magical behaviour).

Certainty adds `estimate` to the catalogue's three values: a modelling minimum resting
on an assumption the books do not give. An estimate exists to stop a model being made
far too small, and must never be presented as a figure from the books. Every fact cites
catalogue records. A fact the catalogue lacks needs a new record first.

Floors are British throughout. A floor number leaves out the ground floor and a storey
count includes it, so the fourteenth floor is the fifteenth storey.
