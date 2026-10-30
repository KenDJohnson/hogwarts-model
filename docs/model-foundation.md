# Source-backed foundation for a Hogwarts model

This is a selected set of constraints to guide an initial blockout, not a complete floor plan. The [description catalogue](catalogue.md) supplies the broader evidence. All pages are generated project reference pages, ref250-v1.

## Working method

Build an adjacency and access graph before fixing coordinates. Keep each room, route and fixture linked to its evidence. Fit dimensions only where the text supplies them; label other dimensions as design choices. A plausible reconstruction can satisfy the text without being uniquely determined by it.

Use separate temporal states for school years, tournament arrangements, changing teachers' furnishings, Christmas and other decorations, access restrictions and wartime damage. Give the Room of Requirement requested interiors and exits. Represent conditional stair and door behaviour as rules on connections, with ordinary traversable geometry for each active state.

Treat named compass directions and floor levels as local constraints with a source, not permission to fill in an entire map. Distinguish British ground-floor numbering, the floor of an entrance and the levels occupied by a tower. A staircase count is not a storey count. Screen adaptations are not additional evidence for this project.

## Questions the reconstruction must keep open

- Exact castle footprint, tower diameters and heights, most room dimensions and corridor lengths.
- Complete site orientation, lake shape, terrain contours and the geometry of unmeasured routes.
- Locations and destinations of secret passages not individually identified by the text.
- Interiors of rooms that are mentioned without being described in the reviewed evidence.
- How to implement conflicting floor references without presenting the chosen repair as canon.

## Terrain and arrival

### M001: Castle

The first lake view places the many-turreted, many-towered castle high above the water, on a mountain and then explicitly on a cliff.

Relation: `Castle` → `stands_on` → `High mountain/cliff above the lake`.

Evidence: explicit; state: Book 1 arrival.

Model implication: Preserve substantial elevation and a cliff-facing lake approach. The text supplies neither contour elevations nor a complete shoreline or compass bearing.

- [Book 1, ch. 6, “The Journey from Platform Nine and Three-Quarters”, ref p. 114–115, ¶278 (B01-C006-P0278)](../build/reader/book-01.html#B01-C006-P0278)
- [Book 1, ch. 6, “The Journey from Platform Nine and Three-Quarters”, ref p. 115, ¶281 (B01-C006-P0281)](../build/reader/book-01.html#B01-C006-P0281)

### M002: First-year boat route

The boats enter a broad cliff opening behind ivy, travel along a dark tunnel seemingly beneath the castle, and land at an underground harbour with rocks and pebbles.

Relation: `First-year boat route` → `passes_through` → `Ivy-hidden cliff opening and dark tunnel to underground harbour`.

Evidence: explicit; state: Book 1 arrival.

Model implication: The impression that the tunnel goes under the castle is qualified in the narration. Do not replace the harbour with an exposed film boathouse.

- [Book 1, ch. 6, “The Journey from Platform Nine and Three-Quarters”, ref p. 115, ¶282 (B01-C006-P0282)](../build/reader/book-01.html#B01-C006-P0282)

### M003: Underground harbour

From the landing, students climb a rock passage to damp grass in the castle's shadow, then ascend stone steps to the large oak front door.

Relation: `Underground harbour` → `connects_via` → `Rising rock passage, grass, stone steps, oak front door`.

Evidence: explicit; state: Book 1 arrival.

Model implication: Keep this traversable sequence. Passage length, exact exit position, and overlap with the carriage approach remain design variables.

- [Book 1, ch. 6, “The Journey from Platform Nine and Three-Quarters”, ref p. 115, ¶284 (B01-C006-P0284)](../build/reader/book-01.html#B01-C006-P0284)
- [Book 1, ch. 6, “The Journey from Platform Nine and Three-Quarters”, ref p. 115–116, ¶285 (B01-C006-P0285)](../build/reader/book-01.html#B01-C006-P0285)

### M004: Main gates

Wrought-iron gates are flanked by stone columns carrying winged boars. Carriages ascend a long sloping drive; the oak front doors stand above stone steps.

Relation: `Main gates` → `connect_via` → `Long rising drive to castle entrance`.

Evidence: explicit; state: Books 3 and 4 arrivals.

Model implication: Gate design and a rising approach are constrained. Do not infer a measured distance or a straight drive from the arrival alone.

- [Book 3, ch. 5, “The Dementor”, ref p. 87–88, ¶208 (B03-C005-P0208)](../build/reader/book-03.html#B03-C005-P0208)
- [Book 4, ch. 12, “The Triwizard Tournament”, ref p. 179–180, ¶1 (B04-C012-P0001)](../build/reader/book-04.html#B04-C012-P0001)

### M005: Main gates

Walking out between the boar-topped pillars, students turn left onto the road into the village.

Relation: `Main gates` → `exit_left_towards` → `Road into Hogsmeade`.

Evidence: explicit; state: Book 5 Hogsmeade visit.

Model implication: Left is relative to the direction of exit; it is not a compass bearing.

- [Book 5, ch. 16, “In the Hog’s Head”, ref p. 394, ¶44 (B05-C016-P0044)](../build/reader/book-05.html#B05-C016-P0044)

### M006: Hagrid's cabin

Students descend the sloping lawns to Hagrid's hut at the edge of the Forbidden Forest; another visit describes the cabin as small and wooden.

Relation: `Hagrid's cabin` → `stands_at` → `Forbidden Forest edge below sloping lawns`.

Evidence: explicit; state: Books 3 and 4 lessons.

Model implication: Preserve the downhill castle-to-cabin route and forest adjacency without choosing a compass quadrant from adaptation imagery.

- [Book 3, ch. 6, “Talons and Tea Leaves”, ref p. 112, ¶151 (B03-C006-P0151)](../build/reader/book-03.html#B03-C006-P0151)
- [Book 4, ch. 13, “Mad-Eye Moody”, ref p. 204, ¶17 (B04-C013-P0017)](../build/reader/book-04.html#B04-C013-P0017)

### M007: Herbology greenhouses

Herbology takes place in greenhouses behind the castle. A later flight across the grounds passes vegetable gardens, greenhouses, the Whomping Willow, then forest shelter.

Relation: `Herbology greenhouses` → `are_behind` → `Castle`.

Evidence: explicit; state: Books 1 and 3.

Model implication: Behind is a viewpoint-relative description. The travel sequence gives connectivity and proximity rather than a surveyed straight line.

- [Book 1, ch. 8, “The Potions Master”, ref p. 136, ¶13 (B01-C008-P0013)](../build/reader/book-01.html#B01-C008-P0013)
- [Book 3, ch. 21, “Hermione’s Secret”, ref p. 400, ¶129 (B03-C021-P0129)](../build/reader/book-03.html#B03-C021-P0129)

### M008: Lakeside beech

A large beech shades a study spot at the lake edge. Harry later sees the same tree directly ahead from the window beside Neville's bed.

Relation: `Lakeside beech` → `is_visible_from` → `Window beside Neville's bed`.

Evidence: explicit; state: Book 5; tree also identified in a school memory.

Model implication: Use a line-of-sight constraint between a particular Gryffindor dormitory window and this tree. It does not locate every tower window or the whole shoreline.

- [Book 5, ch. 17, “Educational Decree Number Twenty-four”, ref p. 412–413, ¶1 (B05-C017-P0001)](../build/reader/book-05.html#B05-C017-P0001)
- [Book 5, ch. 28, “Snape’s Worst Memory”, ref p. 767, ¶212 (B05-C028-P0212)](../build/reader/book-05.html#B05-C028-P0212)
- [Book 5, ch. 29, “Careers Advice”, ref p. 784–785, ¶96 (B05-C029-P0096)](../build/reader/book-05.html#B05-C029-P0096)

### M009: Dumbledore's tomb

At the funeral, white flames leave a white marble tomb around the body and its table. A later visit places it beside the lake, reflected in the water.

Relation: `Dumbledore's tomb` → `stands_beside` → `Lake`.

Evidence: explicit; state: Added at end of Book 6; present in Book 7.

Model implication: This is a dated addition. Earlier school-year scenes should omit it. No source-backed footprint dimensions are supplied by these passages.

- [Book 6, ch. 30, “The White Tomb”, ref p. 680, ¶62 (B06-C030-P0062)](../build/reader/book-06.html#B06-C030-P0062)
- [Book 7, ch. 24, “The Wandmaker”, ref p. 530, ¶252 (B07-C024-P0252)](../build/reader/book-07.html#B07-C024-P0252)

## Entrance and shared rooms

### M010: Entrance Hall

The Entrance Hall is extremely large, with a ceiling too high for Harry to make out. A marble staircase faces the arriving group and leads to upper floors.

Relation: `Entrance Hall` → `contains` → `Flagged stone floor, torchlit stone walls, very high ceiling, marble staircase`.

Evidence: explicit; state: Book 1 arrival.

Model implication: The comparison to the Dursleys' house communicates scale without providing a reliable measurement. Preserve material, volume, and approach-facing staircase.

- [Book 1, ch. 7, “The Sorting Hat”, ref p. 116, ¶4 (B01-C007-P0004)](../build/reader/book-01.html#B01-C007-P0004)
- [Book 1, ch. 7, “The Sorting Hat”, ref p. 116, ¶5 (B01-C007-P0005)](../build/reader/book-01.html#B01-C007-P0005)

### M011: Entrance Hall arrival

Crossing the Entrance Hall on arrival, Harry hears the school through a doorway to the right. McGonagall first leads the newcomers into a small empty chamber off the hall.

Relation: `Entrance Hall arrival` → `has_on_right` → `Doorway carrying the Great Hall's crowd noise`.

Evidence: explicit; state: Book 1 sorting.

Model implication: Keep the small waiting chamber separate from the Great Hall and from later rooms behind the staff table. Right is relative to this approach.

- [Book 1, ch. 7, “The Sorting Hat”, ref p. 116, ¶5 (B01-C007-P0005)](../build/reader/book-01.html#B01-C007-P0005)
- [Book 1, ch. 7, “The Sorting Hat”, ref p. 116–117, ¶6 (B01-C007-P0006)](../build/reader/book-01.html#B01-C007-P0006)

### M012: Great Hall

Thousands of floating candles illuminate four student tables set with gold plates and goblets. A further long table seats the teachers at the top of the Hall. The ceiling looks like the starry sky; Hermione explains the enchantment.

Relation: `Great Hall` → `contains` → `Four long house tables and a staff table at the top`.

Evidence: explicit; state: Book 1 sorting feast.

Model implication: The ceiling's appearance is observed; its explanation is reported dialogue within the same passage. Do not assign an unsupported hall length or permanent table orientation beyond the staff-table relationship.

- [Book 1, ch. 7, “The Sorting Hat”, ref p. 119–120, ¶28 (B01-C007-P0028)](../build/reader/book-01.html#B01-C007-P0028)

### M013: Kitchens

The kitchens form an enormous high-ceilinged room as large as the Great Hall above, with stone walls, brass cookware and a large brick fireplace at the far end. Four wooden tables correspond exactly to the four house tables overhead.

Relation: `Kitchens` → `are_below` → `Great Hall`.

Evidence: explicit; state: Book 4 kitchen visit.

Model implication: Stack the two spaces and align the four table positions. Food transmission through the ceiling is Harry's supposition here; a visible shaft or lift is not established.

- [Book 4, ch. 21, “The House-Elf Liberation Front”, ref p. 395, ¶109 (B04-C021-P0109)](../build/reader/book-04.html#B04-C021-P0109)
- [Book 4, ch. 21, “The House-Elf Liberation Front”, ref p. 396, ¶118 (B04-C021-P0118)](../build/reader/book-04.html#B04-C021-P0118)

### M014: Kitchen approach

Descending the marble staircase into the Entrance Hall, Hermione turns left at its bottom, uses a doorway, and descends stone steps to a broad torchlit corridor painted with food pictures. Tickling the green pear in the fruit-bowl painting produces a green door handle.

Relation: `Kitchen approach` → `descends_from` → `Entrance Hall to bright food-painted stone corridor`.

Evidence: explicit; state: Book 4 kitchen visit.

Model implication: Maintain this local sequence and interaction. The route is explicitly contrasted with the gloomy passage to Snape's dungeon, so do not merge the two solely because both descend.

- [Book 4, ch. 21, “The House-Elf Liberation Front”, ref p. 393, ¶97 (B04-C021-P0097)](../build/reader/book-04.html#B04-C021-P0097)
- [Book 4, ch. 21, “The House-Elf Liberation Front”, ref p. 393–394, ¶99 (B04-C021-P0099)](../build/reader/book-04.html#B04-C021-P0099)
- [Book 4, ch. 21, “The House-Elf Liberation Front”, ref p. 394, ¶103 (B04-C021-P0103)](../build/reader/book-04.html#B04-C021-P0103)
- [Book 4, ch. 21, “The House-Elf Liberation Front”, ref p. 394–395, ¶108 (B04-C021-P0108)](../build/reader/book-04.html#B04-C021-P0108)

## Towers and house spaces

### M015: Gryffindor entrance

The flight from the forbidden third-floor room ends at the Fat Lady's portrait on the seventh floor.

Relation: `Gryffindor entrance` → `is_on` → `Seventh floor at the Fat Lady's portrait`.

Evidence: explicit; state: Book 1 midnight expedition.

Model implication: This fixes an entrance level, not the count of complete floors throughout every tower. Use British floor numbering consistently.

- [Book 1, ch. 9, “The Midnight Duel”, ref p. 164–165, ¶200 (B01-C009-P0200)](../build/reader/book-01.html#B01-C009-P0200)

### M016: Gryffindor boys' dormitory

Separate doors lead girls and boys towards their dormitories. Harry's tower dormitory is above a spiral staircase and contains five four-posters with deep-red velvet hangings; later narration identifies a circular room with high, narrow windows.

Relation: `Gryffindor boys' dormitory` → `is_reached_by` → `Spiral staircase from common room`.

Evidence: explicit; state: Books 1 and 2 arrivals.

Model implication: Five beds describe this particular cohort's room. Do not extrapolate identical capacities or all other rooms' geometry without their own evidence.

- [Book 1, ch. 7, “The Sorting Hat”, ref p. 133, ¶183 (B01-C007-P0183)](../build/reader/book-01.html#B01-C007-P0183)
- [Book 2, ch. 5, “The Whomping Willow”, ref p. 85–86, ¶189 (B02-C005-P0189)](../build/reader/book-02.html#B02-C005-P0189)

### M017: Slytherin common room

A spoken password opens a concealed stone door. Beyond lies a long, low underground room with rough stone walls and ceiling, greenish round lamps on chains, a fire below an ornate carved mantelpiece, and carved chairs.

Relation: `Slytherin common room` → `is_entered_through` → `Sliding stone door concealed in damp bare wall`.

Evidence: explicit; state: Book 2 Polyjuice visit.

Model implication: These passages establish an underground room. They do not establish large underwater viewing windows; any such addition needs other textual evidence.

- [Book 2, ch. 12, “The Polyjuice Potion”, ref p. 223, ¶155 (B02-C012-P0155)](../build/reader/book-02.html#B02-C012-P0155)
- [Book 2, ch. 12, “The Polyjuice Potion”, ref p. 223, ¶158 (B02-C012-P0158)](../build/reader/book-02.html#B02-C012-P0158)
- [Book 2, ch. 12, “The Polyjuice Potion”, ref p. 223–224, ¶159 (B02-C012-P0159)](../build/reader/book-02.html#B02-C012-P0159)

### M018: Hufflepuff route

On the Marauder's Map, Harry follows the Hufflepuffs back to the basement corridor also used to reach the kitchens. The Ravenclaws return to a west-side tower, and Gryffindors to the Fat Lady along the corridor.

Relation: `Hufflepuff route` → `ends_in` → `Basement corridor also leading to kitchens`.

Evidence: explicit; state: Book 5 DA meeting dispersal.

Model implication: This is useful comparative route evidence. It does not describe a Hufflepuff common-room interior or its door mechanism.

- [Book 5, ch. 18, “Dumbledore’s Army”, ref p. 466, ¶258 (B05-C018-P0258)](../build/reader/book-05.html#B05-C018-P0258)

### M019: Ravenclaw common room

The climb winds tightly to an old wooden door with no handle or keyhole and a bronze eagle knocker. Entry is granted after a reasoned answer to a question.

Relation: `Ravenclaw common room` → `is_reached_by` → `Tight spiral stair and eagle-knocker door`.

Evidence: explicit; state: Book 7 Ravenclaw visit.

Model implication: The earlier fifth-floor exit from the Room of Requirement is not itself the common-room floor. Preserve the intervening route and ascent.

- [Book 7, ch. 29, “The Lost Diadem”, ref p. 621, ¶152 (B07-C029-P0152)](../build/reader/book-07.html#B07-C029-P0152)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 621, ¶153 (B07-C029-P0153)](../build/reader/book-07.html#B07-C029-P0153)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 621–622, ¶154 (B07-C029-P0154)](../build/reader/book-07.html#B07-C029-P0154)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 622, ¶157 (B07-C029-P0157)](../build/reader/book-07.html#B07-C029-P0157)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 622, ¶159 (B07-C029-P0159)](../build/reader/book-07.html#B07-C029-P0159)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 622, ¶161 (B07-C029-P0161)](../build/reader/book-07.html#B07-C029-P0161)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 622, ¶162 (B07-C029-P0162)](../build/reader/book-07.html#B07-C029-P0162)

### M020: Ravenclaw common room

The room is wide, circular and airy, with graceful arched windows, blue and bronze wall silks, a domed star-painted ceiling and matching midnight-blue carpet, tables, chairs and bookcases. Rowena's white marble statue stands opposite the entrance by another door.

Relation: `Ravenclaw common room` → `contains` → `Arched windows, blue/bronze silks, star dome and carpet, white marble founder statue`.

Evidence: explicit; state: Book 7 Ravenclaw visit.

Model implication: The mountain view by day is a narrative projection from this night-time visit. Harry only guesses that the adjacent door leads to dormitories above; retain that qualification.

- [Book 7, ch. 29, “The Lost Diadem”, ref p. 622, ¶163 (B07-C029-P0163)](../build/reader/book-07.html#B07-C029-P0163)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 622–623, ¶164 (B07-C029-P0164)](../build/reader/book-07.html#B07-C029-P0164)

### M021: Divination classroom

The North Tower approach ends at a tiny landing without doors. A circular ceiling trapdoor labelled for Trelawney admits a descending silver ladder. Above is a circular, heavily furnished room with at least twenty small round tables, armchairs and pouffes, red-shaded light, closed curtains and a scented fire.

Relation: `Divination classroom` → `occupies` → `Top of North Tower above trapdoor and ladder`.

Evidence: explicit; state: Book 3 first Divination class.

Model implication: The name/location comes from the timetable dialogue and journey; room fixtures are directly observed. The seven staircases climbed on this unfamiliar route do not prove exactly seven storeys.

- [Book 3, ch. 6, “Talons and Tea Leaves”, ref p. 98, ¶31 (B03-C006-P0031)](../build/reader/book-03.html#B03-C006-P0031)
- [Book 3, ch. 6, “Talons and Tea Leaves”, ref p. 101, ¶52 (B03-C006-P0052)](../build/reader/book-03.html#B03-C006-P0052)
- [Book 3, ch. 6, “Talons and Tea Leaves”, ref p. 101, ¶53 (B03-C006-P0053)](../build/reader/book-03.html#B03-C006-P0053)
- [Book 3, ch. 6, “Talons and Tea Leaves”, ref p. 101, ¶54 (B03-C006-P0054)](../build/reader/book-03.html#B03-C006-P0054)
- [Book 3, ch. 6, “Talons and Tea Leaves”, ref p. 101–102, ¶56 (B03-C006-P0056)](../build/reader/book-03.html#B03-C006-P0056)

### M022: North Tower approach landing

At the unfamiliar landing, Ron rejects a passage because it heads south and points to a bit of lake visible through the window.

Relation: `North Tower approach landing` → `has_reported_south_view_towards` → `A visible part of the lake`.

Evidence: reported; state: Book 3 first Divination journey.

Model implication: Treat as a useful local orientation report, with Ron's navigation uncertainty. It does not establish a complete north-up site plan.

- [Book 3, ch. 6, “Talons and Tea Leaves”, ref p. 99, ¶34 (B03-C006-P0034)](../build/reader/book-03.html#B03-C006-P0034)
- [Book 3, ch. 6, “Talons and Tea Leaves”, ref p. 99, ¶35 (B03-C006-P0035)](../build/reader/book-03.html#B03-C006-P0035)
- [Book 3, ch. 6, “Talons and Tea Leaves”, ref p. 99, ¶36 (B03-C006-P0036)](../build/reader/book-03.html#B03-C006-P0036)

### M023: Owlery

The Owlery is at the top of West Tower: a circular stone room with glassless windows, cold draughts, straw/droppings/bones underfoot, and owl perches rising towards the tower top.

Relation: `Owlery` → `occupies` → `Top of West Tower`.

Evidence: explicit; state: Book 4 dawn visit.

Model implication: Represent the draughty open windows and vertical perches. No exact tower diameter or independently surveyed position is supplied here.

- [Book 4, ch. 15, “Beauxbatons and Durmstrang”, ref p. 237, ¶5 (B04-C015-P0005)](../build/reader/book-04.html#B04-C015-P0005)
- [Book 4, ch. 15, “Beauxbatons and Durmstrang”, ref p. 238, ¶6 (B04-C015-P0006)](../build/reader/book-04.html#B04-C015-P0006)

### M024: Flitwick's office

Dumbledore directs the rescuers to Flitwick's seventh-floor office with a window-count instruction involving West Tower. Harry later counts windows to the right of that tower.

Relation: `Flitwick's office` → `has_reported_rescue_window` → `Seventh floor, thirteenth window relative to West Tower`.

Evidence: reported; state: Book 3 Sirius rescue.

Model implication: Preserve both the instruction's wording and the observed counting action in source inspection; do not turn an ambiguous right/from-right reference into an unquestioned façade coordinate.

- [Book 3, ch. 21, “Hermione’s Secret”, ref p. 396, ¶82 (B03-C021-P0082)](../build/reader/book-03.html#B03-C021-P0082)
- [Book 3, ch. 21, “Hermione’s Secret”, ref p. 416, ¶315 (B03-C021-P0315)](../build/reader/book-03.html#B03-C021-P0315)

### M025: Astronomy Tower

The Astronomy Tower is named as the castle's highest tower. Its top has crenellated ramparts and a door with an iron ring giving access to a spiral staircase back into the castle.

Relation: `Astronomy Tower` → `is_highest_of` → `Castle towers`.

Evidence: explicit; state: Book 6 return from the cave.

Model implication: Maintain a relative height ordering and a usable stair door. The rooftop scene does not provide the tower's absolute height or all surrounding roof levels.

- [Book 6, ch. 27, “The Lightning-Struck Tower”, ref p. 613–614, ¶36 (B06-C027-P0036)](../build/reader/book-06.html#B06-C027-P0036)
- [Book 6, ch. 27, “The Lightning-Struck Tower”, ref p. 614, ¶37 (B06-C027-P0037)](../build/reader/book-06.html#B06-C027-P0037)
- [Book 6, ch. 27, “The Lightning-Struck Tower”, ref p. 614, ¶38 (B06-C027-P0038)](../build/reader/book-06.html#B06-C027-P0038)
- [Book 6, ch. 27, “The Lightning-Struck Tower”, ref p. 614–615, ¶44 (B06-C027-P0044)](../build/reader/book-06.html#B06-C027-P0044)

## Variable and hidden spaces

### M026: Castle circulation

The castle has 142 staircases of varied forms. Some lead to different destinations on Fridays or contain a vanishing step; doors may respond to polite requests or tickling, while apparent doors may be solid walls. Portrait subjects visit other frames.

Relation: `Castle circulation` → `includes` → `142 varied staircases and conditional doors/routes`.

Evidence: explicit; state: Book 1 first school days.

Model implication: The stated count is firm; the distribution is not. Support conditional connections and steps. This passage does not require the film's large rotating staircase mechanism. The armour's mobility is Harry's belief here, not equally firm observation.

- [Book 1, ch. 8, “The Potions Master”, ref p. 134, ¶8 (B01-C008-P0008)](../build/reader/book-01.html#B01-C008-P0008)

### M027: Room of Requirement entrance

The meeting place is on the seventh floor opposite the tapestry of Barnabas and the trolls. Three concentrated passes along a blank wall, between a window and a large vase, produce a polished door with a brass handle.

Relation: `Room of Requirement entrance` → `is_opposite` → `Barnabas tapestry on seventh floor`.

Evidence: explicit; state: Book 5 first DA session.

Model implication: Keep a stable external anchor and implement the interior as a requested state rather than assigning all incarnations one fixed ordinary room.

- [Book 5, ch. 18, “Dumbledore’s Army”, ref p. 456, ¶169 (B05-C018-P0169)](../build/reader/book-05.html#B05-C018-P0169)
- [Book 5, ch. 18, “Dumbledore’s Army”, ref p. 458, ¶185 (B05-C018-P0185)](../build/reader/book-05.html#B05-C018-P0185)
- [Book 5, ch. 18, “Dumbledore’s Army”, ref p. 458, ¶186 (B05-C018-P0186)](../build/reader/book-05.html#B05-C018-P0186)
- [Book 5, ch. 18, “Dumbledore’s Army”, ref p. 458, ¶187 (B05-C018-P0187)](../build/reader/book-05.html#B05-C018-P0187)
- [Book 5, ch. 18, “Dumbledore’s Army”, ref p. 458–459, ¶190 (B05-C018-P0190)](../build/reader/book-05.html#B05-C018-P0190)

### M028: DA practice room

In its practice state the Room of Requirement is spacious and torchlit, with wall bookcases, silk floor cushions and dark detectors on shelves at the far end. The torches are compared to those in dungeons eight floors below.

Relation: `DA practice room` → `has_state` → `Spacious torchlit room with bookcases, cushions and detectors`.

Evidence: explicit; state: Book 5 first DA session.

Model implication: The eight-floor comparison supplies a relative level clue. Do not use it to solve every basement or wing into one uniform section.

- [Book 5, ch. 18, “Dumbledore’s Army”, ref p. 458–459, ¶190 (B05-C018-P0190)](../build/reader/book-05.html#B05-C018-P0190)
- [Book 5, ch. 18, “Dumbledore’s Army”, ref p. 459, ¶191 (B05-C018-P0191)](../build/reader/book-05.html#B05-C018-P0191)

### M029: Room of Requirement refuge

The refuge has wood-panelled windowless walls, a balcony, multicoloured hammocks, house hangings, books and a wireless. Neville explains its growth with new arrivals and the appearance of a food-supply passage to Aberforth; Seamus reports added hammocks and a bathroom.

Relation: `Room of Requirement refuge` → `expands_and_connects_to` → `DA hideout and Hog's Head passage`.

Evidence: explicit; state: Book 7 refuge.

Model implication: The observed interior is explicit; growth, entry protections and passage creation are residents' reports. The room does not simply conjure food in this account.

- [Book 7, ch. 29, “The Lost Diadem”, ref p. 611, ¶59 (B07-C029-P0059)](../build/reader/book-07.html#B07-C029-P0059)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 611–612, ¶61 (B07-C029-P0061)](../build/reader/book-07.html#B07-C029-P0061)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 612, ¶63 (B07-C029-P0063)](../build/reader/book-07.html#B07-C029-P0063)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 612, ¶64 (B07-C029-P0064)](../build/reader/book-07.html#B07-C029-P0064)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 613, ¶66 (B07-C029-P0066)](../build/reader/book-07.html#B07-C029-P0066)

### M030: Hog's Head passage

The route begins behind Ariana's portrait above the mantelpiece, passes smooth stone steps into a brass-lamped passage with a worn earth floor, later climbs steeply, and ends with another short stair and concealed door into the refuge.

Relation: `Hog's Head passage` → `connects` → `Ariana portrait above fireplace to Room of Requirement`.

Evidence: explicit; state: Book 7 return to Hogwarts.

Model implication: Treat as a later-created connection, separate from the earlier seven passages. Distance and how it fits physically into exterior terrain remain unconstrained.

- [Book 7, ch. 29, “The Lost Diadem”, ref p. 606, ¶7 (B07-C029-P0007)](../build/reader/book-07.html#B07-C029-P0007)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 606, ¶10 (B07-C029-P0010)](../build/reader/book-07.html#B07-C029-P0010)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 610, ¶46 (B07-C029-P0046)](../build/reader/book-07.html#B07-C029-P0046)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 610–611, ¶51 (B07-C029-P0051)](../build/reader/book-07.html#B07-C029-P0051)

### M031: Room of Requirement exit used by Harry and Luna

A long torchlit stair with unexpected turns leads from the refuge to a wall which melts open and reseals. The Marauder's Map places Harry and Luna in a fifth-floor corridor.

Relation: `Room of Requirement exit used by Harry and Luna` → `emerges_on` → `Fifth-floor corridor`.

Evidence: explicit; state: Book 7 Ravenclaw expedition.

Model implication: Do not relocate the regular seventh-floor entrance to reconcile this. Model a state-dependent exit and its connecting stair.

- [Book 7, ch. 29, “The Lost Diadem”, ref p. 620, ¶146 (B07-C029-P0146)](../build/reader/book-07.html#B07-C029-P0146)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 620, ¶147 (B07-C029-P0147)](../build/reader/book-07.html#B07-C029-P0147)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 620–621, ¶148 (B07-C029-P0148)](../build/reader/book-07.html#B07-C029-P0148)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 621, ¶149 (B07-C029-P0149)](../build/reader/book-07.html#B07-C029-P0149)

### M032: Earlier secret passages

Fred describes seven passages, four known to Filch, one behind a fourth-floor mirror blocked since the preceding winter, one under the Whomping Willow, and one from the one-eyed witch to Honeydukes' cellar. Neville later reports the older passages sealed and guarded.

Relation: `Earlier secret passages` → `have_reported_count` → `Seven, with blocked and guarded variants`.

Evidence: reported; state: Book 3 map explanation; Book 7 occupation.

Model implication: Do not invent destinations for the four unnamed routes or reuse one fixed open/closed state across all years.

- [Book 3, ch. 10, “The Marauder’s Map”, ref p. 192–193, ¶98 (B03-C010-P0098)](../build/reader/book-03.html#B03-C010-P0098)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 606, ¶11 (B07-C029-P0011)](../build/reader/book-07.html#B07-C029-P0011)
- [Book 7, ch. 29, “The Lost Diadem”, ref p. 606–607, ¶12 (B07-C029-P0012)](../build/reader/book-07.html#B07-C029-P0012)

### M033: Honeydukes passage entrance

The statue is halfway along the third-floor corridor. The map demonstrates tapping it with a wand and speaking Dissendium to open access.

Relation: `Honeydukes passage entrance` → `is_on` → `Third-floor corridor in one-eyed humpbacked witch statue`.

Evidence: explicit; state: Book 3 first illicit Hogsmeade visit.

Model implication: This supplies an entrance anchor and interaction. It does not specify the entire tunnel's plan or measured length.

- [Book 3, ch. 10, “The Marauder’s Map”, ref p. 190, ¶63 (B03-C010-P0063)](../build/reader/book-03.html#B03-C010-P0063)
- [Book 3, ch. 10, “The Marauder’s Map”, ref p. 194, ¶113 (B03-C010-P0113)](../build/reader/book-03.html#B03-C010-P0113)
- [Book 3, ch. 10, “The Marauder’s Map”, ref p. 194, ¶114 (B03-C010-P0114)](../build/reader/book-03.html#B03-C010-P0114)

### M034: Whomping Willow tunnel

Lupin explains that the house and tunnel were prepared for his transformations and the tree placed at the tunnel mouth to keep people out. Prodding a knot on the trunk makes entry possible.

Relation: `Whomping Willow tunnel` → `leads_to` → `Shrieking Shack`.

Evidence: reported; state: Book 3 explanation of earlier school history.

Model implication: The route must coexist with dated tree activity and an operable knot interaction. Keep historical explanation distinct from a surveyed route.

- [Book 3, ch. 18, “Moony, Wormtail, Padfoot and Prongs”, ref p. 354, ¶37 (B03-C018-P0037)](../build/reader/book-03.html#B03-C018-P0037)
- [Book 3, ch. 18, “Moony, Wormtail, Padfoot and Prongs”, ref p. 358–359, ¶59 (B03-C018-P0059)](../build/reader/book-03.html#B03-C018-P0059)

## Magic and dated alterations

### M035: Hogwarts Apparition protection

Hermione states that one cannot Apparate within the Hogwarts grounds. During lessons, the instructor explains a one-hour exception confined to the Great Hall. Fleeing attackers later head for gates beyond which they can Disapparate.

Relation: `Hogwarts Apparition protection` → `normally_blocks` → `Apparition and Disapparition inside grounds`.

Evidence: reported; state: Books 4 and 6.

Model implication: Use boundary- and state-dependent travel rules. The flight towards the gates is narrated action, while the enchantment's rule is explained in dialogue.

- [Book 4, ch. 15, “Beauxbatons and Durmstrang”, ref p. 251–252, ¶109 (B04-C015-P0109)](../build/reader/book-04.html#B04-C015-P0109)
- [Book 6, ch. 18, “Birthday Surprises”, ref p. 400, ¶77 (B06-C018-P0077)](../build/reader/book-06.html#B06-C018-P0077)
- [Book 6, ch. 28, “Flight of the Prince”, ref p. 633, ¶23 (B06-C028-P0023)](../build/reader/book-06.html#B06-C028-P0023)

### M036: Castle seen by Muggles

Hermione explains that a Muggle looking at Hogwarts sees an old ruin with an unsafe-entry warning.

Relation: `Castle seen by Muggles` → `is_reported_to_appear_as` → `Decaying ruin with danger sign`.

Evidence: reported; state: Book 4 train conversation.

Model implication: An optional Muggle-view rendering can use this. The following speculation about making a school Unplottable concerns Durmstrang; do not silently transfer that claim to Hogwarts.

- [Book 4, ch. 11, “Aboard the Hogwarts Express”, ref p. 175, ¶79 (B04-C011-P0079)](../build/reader/book-04.html#B04-C011-P0079)
- [Book 4, ch. 11, “Aboard the Hogwarts Express”, ref p. 175, ¶80 (B04-C011-P0080)](../build/reader/book-04.html#B04-C011-P0080)
- [Book 4, ch. 11, “Aboard the Hogwarts Express”, ref p. 175, ¶81 (B04-C011-P0081)](../build/reader/book-04.html#B04-C011-P0081)

### M037: Quidditch goals

The school stadium has raised seating around the pitch and three golden hooped poles at each end, described as fifty feet high.

Relation: `Quidditch goals` → `have_observed_height` → `Fifty feet`.

Evidence: explicit; state: Book 1 first visit inside stadium.

Model implication: This is a useful absolute scale anchor: 50 feet equals 15.24 metres. It does not establish the pitch's length, width, or stand heights.

- [Book 1, ch. 10, “Hallowe’en”, ref p. 169, ¶33 (B01-C010-P0033)](../build/reader/book-01.html#B01-C010-P0033)

### M038: Beauxbatons carriage

The large powder-blue carriage is parked two hundred yards from Hagrid's front door, with a makeshift paddock for its winged horses alongside it.

Relation: `Beauxbatons carriage` → `parks_reportedly_at_distance_from` → `Hagrid's front door: two hundred yards`.

Evidence: explicit; state: Book 4 tournament visit.

Model implication: Use as a temporary placement constraint (200 yards equals 182.88 metres), not a permanent building or precise surveyed bearing.

- [Book 4, ch. 16, “The Goblet of Fire”, ref p. 274, ¶140 (B04-C016-P0140)](../build/reader/book-04.html#B04-C016-P0140)

### M039: Fifth-floor east-wing corridor

The twins' swamp fills a fifth-floor corridor in the east wing. The area is roped off and Filch must ferry students across to their classrooms.

Relation: `Fifth-floor east-wing corridor` → `has_temporary_state` → `Weasley swamp and ferry route`.

Evidence: explicit; state: Book 5 after the twins' departure.

Model implication: Keep the corridor's ordinary traversal separate from the temporary water crossing. The passage gives a wing and floor, not an overall east-wing footprint.

- [Book 5, ch. 30, “Grawp”, ref p. 805, ¶2 (B05-C030-P0002)](../build/reader/book-05.html#B05-C030-P0002)

## Conflicts requiring a design decision

### M040: Myrtle's toilet

Hermione places Myrtle's girls' toilet on the first floor in Book 2. Book 4 narration describes her as haunting the girls' toilets on the second floor.

Relation: `Myrtle's toilet` → `has_conflicting_reported_floors` → `First floor in Book 2; second floor in Book 4`.

Evidence: explicit; state: Books 2 and 4.

Model implication: The conflict is explicit in the two sources, though the Book 2 location is dialogue. Keep both constraints and label any chosen implementation. Do not claim that a moving room or floor-renumbering explanation is itself stated canon.

- [Book 2, ch. 8, “The Deathday Party”, ref p. 133–134, ¶94 (B02-C008-P0094)](../build/reader/book-02.html#B02-C008-P0094)
- [Book 4, ch. 22, “The Unexpected Task”, ref p. 416, ¶97 (B04-C022-P0097)](../build/reader/book-04.html#B04-C022-P0097)

## Interactions for an explorable model

### M041: House-elf transport

Ron explains that house-elves can Apparate and Disapparate into and out of Hogwarts even though wizards cannot.

Relation: `House-elf transport` → `has_reported_exception_to` → `Wizard Apparition restrictions`.

Evidence: reported; state: Book 7 explanation.

Model implication: Do not implement the grounds' protection as a universal ban on every type of magical movement. Keep the actor and transport method in the access rule.

- [Book 7, ch. 10, “Kreacher’s Tale”, ref p. 204, ¶157 (B07-C010-P0157)](../build/reader/book-07.html#B07-C010-P0157)

### M042: Paired Vanishing Cabinets

Malfoy describes repairing the Hogwarts cabinet and explains its link to the one in Borgin and Burkes. Harry's earlier hiding route places the broken cabinet among objects in the Room of Requirement.

Relation: `Paired Vanishing Cabinets` → `form_passage_between` → `Hogwarts and Borgin and Burkes`.

Evidence: reported; state: Book 6 repaired invasion route; earlier broken state.

Model implication: The object's location is observed; its mechanism and earlier limbo state are explained by Malfoy. Treat the connection as a portal with dated working/broken states, rather than an ordinary continuous tunnel.

- [Book 6, ch. 24, “Sectumsempra”, ref p. 554–555, ¶105 (B06-C024-P0105)](../build/reader/book-06.html#B06-C024-P0105)
- [Book 6, ch. 27, “The Lightning-Struck Tower”, ref p. 617–618, ¶74 (B06-C027-P0074)](../build/reader/book-06.html#B06-C027-P0074)
- [Book 6, ch. 27, “The Lightning-Struck Tower”, ref p. 618, ¶78 (B06-C027-P0078)](../build/reader/book-06.html#B06-C027-P0078)
- [Book 6, ch. 27, “The Lightning-Struck Tower”, ref p. 618–619, ¶79 (B06-C027-P0079)](../build/reader/book-06.html#B06-C027-P0079)

### M043: Chamber entrance in Myrtle's bathroom

A tiny snake is scratched into a copper tap that Myrtle says has never worked. Harry's hissing command makes the tap light up and spin; the sink sinks away, exposing a pipe large enough for a person to slide into.

Relation: `Chamber entrance in Myrtle's bathroom` → `opens_with` → `Parseltongue at snake-marked copper tap`.

Evidence: explicit; state: Book 2 Chamber rescue.

Model implication: Represent the sink and tap as a transformable entrance, with the shaft below. Preserve the separate uncertainty about the bathroom's numbered floor.

- [Book 2, ch. 16, “The Chamber of Secrets”, ref p. 303, ¶181 (B02-C016-P0181)](../build/reader/book-02.html#B02-C016-P0181)
- [Book 2, ch. 16, “The Chamber of Secrets”, ref p. 303, ¶182 (B02-C016-P0182)](../build/reader/book-02.html#B02-C016-P0182)
- [Book 2, ch. 16, “The Chamber of Secrets”, ref p. 303, ¶183 (B02-C016-P0183)](../build/reader/book-02.html#B02-C016-P0183)
- [Book 2, ch. 16, “The Chamber of Secrets”, ref p. 303, ¶188 (B02-C016-P0188)](../build/reader/book-02.html#B02-C016-P0188)
- [Book 2, ch. 16, “The Chamber of Secrets”, ref p. 303, ¶189 (B02-C016-P0189)](../build/reader/book-02.html#B02-C016-P0189)
- [Book 2, ch. 16, “The Chamber of Secrets”, ref p. 303–304, ¶190 (B02-C016-P0190)](../build/reader/book-02.html#B02-C016-P0190)

### M044: Gryffindor girls' dormitory staircase

Ron opens the dormitory door and starts up its spiral stair. At his sixth step a klaxon-like alarm sounds and the stairs become a long smooth stone slide; girls subsequently slide down it too. Hermione explains the old access rule.

Relation: `Gryffindor girls' dormitory staircase` → `changes_to` → `Smooth stone slide with alarm when Ron climbs`.

Evidence: explicit; state: Book 5 dormitory incident.

Model implication: Animate a state change in this particular stair. The scene demonstrates the response to Ron; Hermione's explanation is reported policy, not a specification of how the enchantment classifies every possible visitor.

- [Book 5, ch. 17, “Educational Decree Number Twenty-four”, ref p. 415, ¶22 (B05-C017-P0022)](../build/reader/book-05.html#B05-C017-P0022)
- [Book 5, ch. 17, “Educational Decree Number Twenty-four”, ref p. 415, ¶23 (B05-C017-P0023)](../build/reader/book-05.html#B05-C017-P0023)
- [Book 5, ch. 17, “Educational Decree Number Twenty-four”, ref p. 415, ¶24 (B05-C017-P0024)](../build/reader/book-05.html#B05-C017-P0024)
- [Book 5, ch. 17, “Educational Decree Number Twenty-four”, ref p. 416, ¶26 (B05-C017-P0026)](../build/reader/book-05.html#B05-C017-P0026)
- [Book 5, ch. 17, “Educational Decree Number Twenty-four”, ref p. 416, ¶28 (B05-C017-P0028)](../build/reader/book-05.html#B05-C017-P0028)
- [Book 5, ch. 17, “Educational Decree Number Twenty-four”, ref p. 416, ¶29 (B05-C017-P0029)](../build/reader/book-05.html#B05-C017-P0029)

### M045: Merpeople settlement

Beyond black mud and a painted rock, Harry encounters algae-stained stone dwellings with dark windows, weed gardens and a tethered Grindylow. More houses surround a village-like square containing a large merperson statue carved from a boulder; the tournament hostages are tied to its tail.

Relation: `Merpeople settlement` → `occupies` → `Lake floor with stone dwellings and central statue`.

Evidence: explicit; state: Book 4 second task.

Model implication: Include an explorable underwater environment and separate the existing settlement from the temporary hostage installation. Harry's perceived swimming time is not a reliable distance measurement.

- [Book 4, ch. 26, “The Second Task”, ref p. 524–525, ¶141 (B04-C026-P0141)](../build/reader/book-04.html#B04-C026-P0141)
- [Book 4, ch. 26, “The Second Task”, ref p. 525, ¶144 (B04-C026-P0144)](../build/reader/book-04.html#B04-C026-P0144)
- [Book 4, ch. 26, “The Second Task”, ref p. 525, ¶147 (B04-C026-P0147)](../build/reader/book-04.html#B04-C026-P0147)
- [Book 4, ch. 26, “The Second Task”, ref p. 525–526, ¶149 (B04-C026-P0149)](../build/reader/book-04.html#B04-C026-P0149)
- [Book 4, ch. 26, “The Second Task”, ref p. 526, ¶150 (B04-C026-P0150)](../build/reader/book-04.html#B04-C026-P0150)

### M046: Third-task maze

The pitch is transformed into a maze enclosed by a twenty-foot hedge with an entrance gap. Within the high hedges the crowd noise falls silent. Bagman previously says the pitch will be returned to normal after the task.

Relation: `Third-task maze` → `temporarily_replaces` → `Quidditch pitch playing space`.

Evidence: explicit; state: Book 4 third task.

Model implication: The observed hedge height is twenty feet (6.096 metres). Restoration is a reported intention. These passages do not establish a complete maze plan or prove that the sound isolation is magical rather than the effect of dense hedges.

- [Book 4, ch. 28, “The Madness of Mr Crouch”, ref p. 582, ¶142 (B04-C028-P0142)](../build/reader/book-04.html#B04-C028-P0142)
- [Book 4, ch. 31, “The Third Task”, ref p. 654–655, ¶125 (B04-C031-P0125)](../build/reader/book-04.html#B04-C031-P0125)
- [Book 4, ch. 31, “The Third Task”, ref p. 656, ¶135 (B04-C031-P0135)](../build/reader/book-04.html#B04-C031-P0135)

### M047: Great Hall

During the castle search all houses are gathered in the Great Hall. Its entrances are guarded; Dumbledore moves the long tables to the walls and covers the floor in hundreds of purple sleeping bags.

Relation: `Great Hall` → `has_temporary_state` → `Emergency sleeping hall`.

Evidence: explicit; state: Book 3 after the Fat Lady attack.

Model implication: Do not bake the feast tables permanently into the mesh. This room must support cleared-floor arrangements and furniture relocation.

- [Book 3, ch. 9, “Grim Defeat”, ref p. 160, ¶1 (B03-C009-P0001)](../build/reader/book-03.html#B03-C009-P0001)
- [Book 3, ch. 9, “Grim Defeat”, ref p. 160–161, ¶2 (B03-C009-P0002)](../build/reader/book-03.html#B03-C009-P0002)
- [Book 3, ch. 9, “Grim Defeat”, ref p. 161, ¶4 (B03-C009-P0004)](../build/reader/book-03.html#B03-C009-P0004)
- [Book 3, ch. 9, “Grim Defeat”, ref p. 161, ¶8 (B03-C009-P0008)](../build/reader/book-03.html#B03-C009-P0008)

### M048: Entrance Hall

During the Book 6 flight, the oak front doors have been blasted open and the flagstones bear blood. A curse has hit the large Gryffindor hourglass and its rubies are falling onto the floor.

Relation: `Entrance Hall` → `has_damaged_state` → `Blasted doors, bloodied flagstones and broken Gryffindor hourglass`.

Evidence: explicit; state: Book 6 invasion aftermath.

Model implication: Keep fixture identity, damage and scattered contents separate. This is a specific damaged scene, not the normal entrance design.

- [Book 6, ch. 28, “Flight of the Prince”, ref p. 632–633, ¶22 (B06-C028-P0022)](../build/reader/book-06.html#B06-C028-P0022)

### M049: Corridor statues and armour

After McGonagall's spell, corridor statues and suits of armour jump from their plinths. Crashes from floors above and below indicate similar activation elsewhere.

Relation: `Corridor statues and armour` → `can_be_animated_by` → `McGonagall's defensive spell`.

Evidence: explicit; state: Book 7 battle preparation.

Model implication: This provides direct later evidence of animation, stronger than Harry's initial suspicion about armour in Book 1. Plinths should remain when their occupants move.

- [Book 7, ch. 30, “The Sacking of Severus Snape”, ref p. 638, ¶131 (B07-C030-P0131)](../build/reader/book-07.html#B07-C030-P0131)
- [Book 7, ch. 30, “The Sacking of Severus Snape”, ref p. 638, ¶132 (B07-C030-P0132)](../build/reader/book-07.html#B07-C030-P0132)

### M050: School perimeter

Harry and Dumbledore fly above a twisting lane and cross a boundary wall into the grounds. Dumbledore mutters and Harry feels his broom shudder, interpreting this as Dumbledore undoing the protection to permit their approach.

Relation: `School perimeter` → `includes` → `Boundary wall and conditionally passable aerial protection`.

Evidence: explicit; state: Book 6 return flight.

Model implication: The wall and crossing are observed; the explanation is Harry's inference. Keep physical perimeter geometry and magical permission separate.

- [Book 6, ch. 27, “The Lightning-Struck Tower”, ref p. 613–614, ¶36 (B06-C027-P0036)](../build/reader/book-06.html#B06-C027-P0036)

