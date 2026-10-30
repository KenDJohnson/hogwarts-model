# Books 4–5 research handoff

The complete narrative of both assigned books was semantically reviewed, paragraph by paragraph, in bounded, untruncated reading chunks. Every chapter has a full reviewed range in its JSON file. Extraction and searches were not counted as reading. There are no unread ranges.

| Book | Entries | Chapters reviewed | Paragraphs reviewed | Narrative words |
| --- | ---: | ---: | ---: | ---: |
| 4 | 243 | 37 / 37 | 6,131 / 6,131 | 194,253 |
| 5 | 311 | 38 / 38 | 9,069 / 9,069 | 260,727 |
| Total | 554 | 75 / 75 | 15,200 / 15,200 | 454,980 |

The supplied absolute-path corpus was the only narrative source. No other canon, film, wiki, website, or print-page references were used. The EPUB and source checkout were not modified. No EPUB or extracted corpus is tracked in this research branch. Only the two assigned JSON files and this reconciliation note were written.

## Integration

- Book 4 narrative completion milestone: `44e9ca0d100ddf63b9e29f500c2033c35bcf6afd`.
- First Book 5 review commit: `d9c650ec1c016e7811ff3980935524367d371ef6`.
- Book 5 narrative completion milestone: `ca565381b7fea7c4d9836de97a7f570975826344`.
- All chapter/group work was committed progressively on `research/books-4-5` in `/Users/kjohnson/.t3/worktrees/hogwards-model/research-books-4-5`.
- The parent reported integrating Book 4 and adding `B04-C021-P0040` to B04-021 and `B04-C025-P0001` to B04-131 on master. Those parent-side supplements were deliberately not duplicated or overwritten here. Preserve them when reconciling the Book 4 file. No IDs were added for them.

## Modelling reconciliation

- Routes retain the traveller's viewpoint. In particular, Book 5's door down toward Slytherin is on Harry's right while he descends the marble staircase into the Entrance Hall (`B05-C038-P0048`); it is not an entry-facing right-hand designation.
- Preserve stated travel sequences and relative floors without forcing one global floor grid. The Room of Requirement is on the seventh floor, with dungeons described as eight floors below (`B05-C018-P0169`, `B05-C018-P0190`). The hospital sequence descends two floors to a first-floor corridor (`B05-C032-P0019`, `B05-C032-P0023`). The fireworks sequence says one floor below Umbridge's office, then describes movement toward the second floor (`B05-C028-P0091`, `B05-C028-P0093`). These are constraints to reconcile, not invented stair counts or heights.
- Important sightlines include the Owlery to Hagrid's hut and Forest; Gryffindor windows to the beech, Forest and cabin; Charms to the front drive; Umbridge's office to the pitch and grounds; the Headmaster's office to the stadium; and the Astronomy Tower parapet directly above the front doors with a view of the cabin. The records do not supply compass bearings or measured distances for these views.
- Keep temporary and historical states separate: tournament installations and underwater task arrangements; the changing maze; weather and decorations; exam tables; the fifth-floor east-wing swamp and its later preserved window-side remnant; changing Defence office occupants; and the Headmaster's office damage, subsequent intact state, and Harry's later fresh damage.
- The Room of Requirement's furnishings belong to particular uses. Dobby's bed, antidote and cleaning-supply accounts and the twins' broom-cupboard memory are reports. The practice room, door ritual, lock, books, cushions, detectors, later detector table, limited simultaneous Stunning space, and eventual hostile retrieval of the list are separately evidenced. Do not assume a single permanent room configuration or a universal secrecy guarantee.
- Ordinary Apparition restrictions coexist with demonstrated Portkey and phoenix-assisted travel. These mechanisms must remain distinct. Fudge expressly objects to the Ministry authorisation of the returning statue-head Portkey; its successful operation is not proof of legal authorisation.
- The repeatedly dreamed windowless corridor is explicitly identified as the Ministry's Department of Mysteries corridor in `B05-C024-P0227`. London house interiors, Ministry rooms and damage, and the continental giant camp were read completely but are not Hogwarts geometry. Nearby village detail is retained for school access, meeting locations and boundary context.
- Book 4's apparent Moody is revealed as Barty Crouch impersonating him. Earlier observed rooms and objects remain observations; his statements remain attributed reports. Do not promote his account of an event into direct narration merely because he was believed at the time.
- Forest restrictions are partly institutional and partly territorial. The centaurs' claims and treatment of children are contextual statements, not an invisible perimeter wall or an unconditional safety rule. Grawp is initially tethered among damaged trees, later loose with broken ankle ropes. The two visits' clearings and paths should not be silently merged.
- The armed troll guarding Harry's broom is a rumour. Umbridge later confirms strict dungeon guarding without naming a troll. Other unresolved claims, guesses and approximate quantities are identified in the corresponding descriptions or model notes.

## Validation

Both JSON files parsed successfully and passed checks for the exact top-level and entry fields, book numbers, sequential unique IDs, category and certainty enums, nonempty text/evidence, duplicate evidence references, existing same-book corpus evidence IDs, exact chapter count and order, and complete paragraph ranges with the required review method. Book 4 has 1,306 evidence references to 1,209 distinct paragraphs; Book 5 has 1,817 references to 1,689 distinct paragraphs. `git diff --check` passed. These checks establish structural and locator validity; geometric ambiguities above remain for the parent model reconciliation.
