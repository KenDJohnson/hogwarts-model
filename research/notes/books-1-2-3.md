# Books 1–3 reconciliation and handoff

All narrative paragraphs in the supplied extracted corpus were read semantically in complete, manageable chunks. The chapter ledgers record that actual review; extraction and keyword hits were not treated as reading. The supplied EPUB/corpus was the sole source. No outside canon or remembered architecture was used.

| Book | Entries | Chapters fully reviewed | Narrative paragraphs | Narrative words |
| --- | ---: | ---: | ---: | ---: |
| 1 | 145 | 17 | 3,094 | 78,559 |
| 2 | 163 | 18 | 3,217 | 86,242 |
| 3 | 166 | 22 | 4,227 | 109,315 |
| Total | 474 | 57 | 10,538 | 274,116 |

The parent’s second-pass audit added B03-166 for Hermione’s recurrent study corner; the counts above include that supplement.

There are no unread assigned ranges. Every chapter has one review row covering its full paragraph range. Book 2 chapter 12 was deduplicated in commit `eb55658`: the earlier partial range was removed when the completed 1–215 range was retained. The parent’s book 1 omission audit required no changes, and book 1 was left unchanged after that feedback.

## Constraints to preserve during modelling

- **Myrtle’s bathroom, attack corridor and Lockhart’s office:** B02-C008-P0094 reports the bathroom on the first floor, while the pursuit in B02-C008-P0162 and P0165–P0167 reaches the second-floor attack corridor. The bathroom is then directly adjacent to that site. Lockhart’s office is described as second-floor in chapter 7, yet routes put it upstairs from the attack corridor and above the bathroom. Entries keep these statements independently; no silent floor reassignment is justified.
- **Hospital wing:** journeys supply several relative ascents, but the chapter 13 departure from the ward also climbs to the former attack site. The book 3 descent from West Tower adds a route sequence, not an independently named ward floor. Do not derive a single absolute floor from a count of stair sections.
- **Gryffindor clocks and Sorting stools:** book 1 separately describes a wall clock and a grandfather clock by the common-room door. Its four-legged Sorting stool and book 3’s three-legged stool are dated furnishings, not necessarily one immutable object.
- **Hagrid’s pumpkin patch tether:** B03-C016-P0158 places Buckbeak at a tree behind the patch; B03-C021-P0137 and P0170 put the tether on the surrounding fence. Both views are retained. The later axe sound apparently strikes the fence; no specific damage is observed.
- **Flitwick’s office and West Tower:** Dumbledore identifies the office on the seventh floor with a thirteenth-window locator relative to the tower (B03-C021-P0082). Harry subsequently counts windows to the tower’s right (P0315). This does not establish that the office is inside West Tower. The aerial rescue and the subsequent West Tower battlement landing are distinct stages.
- **Buckbeak hearing chronology:** the earlier April-20 hearing letter and the later “this Friday” planning after the February sequence remain unreconciled in the entries. Do not use that ambiguity to relocate fixtures or infer an additional hearing room at Hogwarts.
- **Views and travel distances:** preserve viewpoint-relative left/right, subjective tunnel-length comparisons, and interrupted journeys. Lake crossings by a Patronus do not establish ordinary walkability, a causeway, or underwater terrain. The arrival lake voyage, castle windows, Forest lookouts, shores, railway mountain occlusion and gate approaches supply constraints without yielding a complete metrically determined plan.

Schema fields, allowed categories/certainty, sequential unique entry IDs, exact evidence existence, unique chapter-review rows and complete paragraph coverage were validated against the supplied corpus. No reference page numbers were typed. No EPUB or extracted narrative text is included in tracked output. The worktree’s tracked changes are limited to the three assigned catalogue files and this note.
