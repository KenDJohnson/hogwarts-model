# Generation brief

Read this before making any image or 3D model of Hogwarts. The first round of
attempts read scattered records and got the size of the castle badly wrong, so
this page says what to read and what every attempt must meet.

## Read in this order

1. [The castle overview](overviews/index.md): the summary, the conventions, the
   floor-by-floor table and the size facts.
2. The overview for your subject, under [docs/overviews/](overviews/), one page per
   area with every place in it. [overviews.json](../research/overviews.json) holds
   the same data for scripts.
3. For 3D work, the [model foundation](model-foundation.md), starting with
   "Scale and capacity".
4. The [catalogue](catalogue.md) or the area guides in [docs/areas/](areas/index.md),
   only when you need a record's detail.

Each overview fact carries one of four labels. Build explicit facts as given. Treat
reported facts as what a character said. Inferences show their reasoning. Estimates
are minimums resting on an assumption, so design above them, and never present one
as coming from the books.

## Rules for every attempt

- Floors are British. The first floor is one flight above the ground floor, so the
  seventh floor is the eighth storey.
- Only the novels are evidence. Keep film, game and wiki geography out, including
  the film castle's silhouette, its rotating stairwell and its boathouse.
- When a description, a prompt and these checks disagree, the checks win.
- A scale check needs a number you measured or counted in the output. A note that a
  model "samples" a count does not pass it.
- Where the books conflict, the overview says so. Pick a reading and label it as a
  choice.
- For images, leave people out, and keep "Hogwarts", "Harry Potter" and character
  names out of prompts, since those words pull image models towards the films.
- Write original prose. Nothing from the novels longer than a few words goes in the
  repository, which is public.

## Checks for the whole castle

| Check | Must show | Source |
|---|---|---|
| Storeys | At least eight storeys in the main body, above a dungeon level | M052 |
| Windows | At least eight rows of windows on the main body, more up the towers | Castle overview |
| Staircases | 142 separate flights, about 16 to 20 between each pair of floors | M053 |
| Gryffindor Tower | Entrance on the seventh floor, then dormitory levels above: top floor 14 is the working figure, 9 the strict minimum | M054 |
| Dormitories | Boys' and girls' stairs both reach real rooms. Seven year groups on each. Round rooms with about five beds | M054 |
| Tower order | Astronomy tallest, above the top of Gryffindor. Ravenclaw and Gryffindor next. West and North lower, still above the seventh floor | M055 |
| Seventh floor | Gryffindor entrance, Room of Requirement, gargoyle, Flitwick's office and the North Tower stair | M056 |
| Footprint | A main block at least about 200 m long (estimate) | Castle overview |

## Checks for rooms

| Room | Must show | Source |
|---|---|---|
| Library | Hundreds of narrow rows, so at least 200 in the model. About 1,500 m² of floor or more, as one hall or a suite. In an image, rows that run out of sight in depth, not to an end wall | M057 |
| Great Hall | About 1,200 people seated at once. At least 1,200 m² and 12 m high. Four long tables, a staff table, thousands of floating candles | M058 |
| Kitchens | Directly below the Great Hall and the same size | M013, M058 |
| Entrance Hall | Room for a whole four-bedroom house, with the ceiling too high to see from the floor | M010 |
| Room of Hidden Things | Cathedral-sized, far bigger than the Great Hall, with fifty-foot walls of objects | M059 |
| Room of Requirement | Door on the seventh floor, facing the Barnabas tapestry | M027 |
| Owlery | Hundreds upon hundreds of owls, in a circular room with perches to the top | M060 |
| Prefects' bathroom | Fifth floor, a bath like a swimming pool, about a hundred taps | M061 |
| Quidditch stands | Seats for the whole school, about 800 to 1,000 (estimate), with hoops fifty feet high | M037, M062 |

## How the first attempts measured up

Audited on 2 November 2026. Model figures come from each generator's code, and
image figures are counts and estimates from the final images. Heights are above the
ground floor.

| 3D models | Opus 5.5 | GPT-6.1 Sol | GPT-6 Astra |
|---|---|---|---|
| Footprint, m | 304 × 156 | 146 × 118 | 166 × 134 |
| Physical staircases | 37, with 142 reached by counting a shaft at every storey | 25 | 27 |
| Gryffindor dormitory rooms | 14 | 1 | 1 |
| Library rows | 42 | 4 | 5 |
| Great Hall, m | 64 × 22 | 26 × 54 | 40 × 50 |
| Places laid in the Great Hall | 272 | 304 | 144 |
| Room of Hidden Things, m³ | 399,840 | 6,482 | 11,552 |

| Images | Fable 5.1 | Opus 5.5 | GPT-6.1 Sol | GPT-6 Astra |
|---|---|---|---|---|
| Rows of windows on the main body | 3 to 4 | 3 to 4 | 3 to 4 | 3 to 4, about 7 terraced |
| Library rows in view | 0, wall cases | About 18 | About 10 | About 9 |
| Great Hall tables | 2 | 4 | 4 | 4 |
| Hidden Things heap height | About 2.5 m | About 3.5 m | About 5 m | About 10 to 12 m |

The worst failures were the library (42 rows at best, against at least 200), the
staircases (no model builds more than 37), and the Gryffindor dormitories (two of
the three models have one room and no working girls' stair).
