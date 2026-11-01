'use strict';
(() => {
  const DATA = window.HOGWARTS_DATA;

  const CATEGORIES = [
    ['interior', 'Interior', 'Rooms and their structure'],
    ['exterior', 'Exterior', 'The outside of buildings'],
    ['grounds', 'Grounds', 'Land, water and plants outside the buildings'],
    ['route', 'Route', 'How places connect, and journeys between them'],
    ['furnishing', 'Furnishing', 'Fixtures, furniture and objects in a place'],
    ['magic', 'Magic', 'Enchantments and the magical rules of a place'],
    ['temporary', 'Temporary', 'Dated states such as decorations, events and damage'],
    ['history', 'History', 'Past events and reports about a place'],
  ];
  const CERTAINTIES = [
    ['explicit', 'Explicit', 'Narrated observation'],
    ['reported', 'Reported', 'A character’s statement, legend or explanation'],
    ['inference', 'Inference', 'A deduction, explained in the model note'],
  ];
  const LONG_PASSAGE_WORDS = 180;
  // The public edition has no book text, so entries rest on their paraphrases and citations.
  const quoted = DATA.meta.quotedWords > 0;
  const EXPAND_ALL = quoted ? ['Show all text', 'Hide all text'] : ['Show all details', 'Hide all details'];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const content = $('#content');
  const sidebar = $('#sidebar');
  const panelElement = $('#panel');
  const layout = $('#layout');
  const search = $('#search');

  const entries = DATA.entries;
  const byId = new Map();
  const places = new Map(DATA.places.map(place => [place.id, place]));
  const areas = new Map(DATA.areas.map(area => [area.id, area]));
  const books = new Map(DATA.books.map(book => [book.number, book]));
  const placeEntries = new Map(DATA.places.map(place => [place.id, []]));
  const areaEntries = new Map(DATA.areas.map(area => [area.id, []]));
  const chapters = new Map();
  DATA.books.forEach(book => book.chapters.forEach(chapter => chapters.set(`${book.number}:${chapter.number}`, chapter)));
  entries.forEach((entry, position) => {
    entry.seq = position + 1;
    entry.book = entry.citations[0].book;
    entry.chapter = entry.citations[0].chapter;
    entry.words = entry.citations.reduce((sum, citation) => sum + citation.words, 0);
    byId.set(entry.id, entry);
    entry.places.forEach(id => placeEntries.get(id).push(entry));
    entry.areas.forEach(id => areaEntries.get(id).push(entry));
  });

  const filters = {q: '', books: new Set(), cats: new Set(), certs: new Set()};
  const panel = {entry: null, scope: null, mainOnly: false};
  let route = {view: 'books'};
  let terms = [];
  let visible = entries;
  let renderedKey = null;
  let currentEntry = null;

  // Text helpers

  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const number = value => value.toLocaleString('en-GB');
  const plural = (count, word) => `${number(count)} ${word}${count === 1 ? '' : 's'}`;
  const chapterOf = (book, chapter) => chapters.get(`${book}:${chapter}`);
  const chapterName = (book, chapter) => chapterOf(book, chapter).epilogue ? 'Epilogue' : `Chapter ${chapter}`;

  // One-for-one substitutions, so a match in folded text has the same offsets in the original.
  const FOLD = {'’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', 'é': 'e', 'è': 'e', 'ù': 'u', 'ï': 'i', 'ä': 'a'};
  const fold = text => text.toLowerCase().replace(/[’‘“”–—éèùïä]/g, c => FOLD[c]);
  const ALIASES = {halloween: "hallowe'en"};

  function parseTerms(query) {
    const found = [];
    for (const match of fold(query).matchAll(/"([^"]+)"|(\S+)/g)) {
      const term = (match[1] ?? match[2]).replace(/^"|"$/g, '');
      if (term) found.push(ALIASES[term] ?? term);
    }
    return found;
  }

  function highlight(text) {
    if (!terms.length) return esc(text);
    const folded = fold(text);
    const spans = [];
    for (const term of terms) {
      for (let at = folded.indexOf(term); at >= 0; at = folded.indexOf(term, at + term.length)) spans.push([at, at + term.length]);
    }
    if (!spans.length) return esc(text);
    spans.sort((a, b) => a[0] - b[0]);
    let out = '';
    let cursor = 0;
    for (const [start, end] of spans) {
      if (end <= cursor) continue;
      const from = Math.max(start, cursor);
      out += esc(text.slice(cursor, from)) + `<mark>${esc(text.slice(from, end))}</mark>`;
      cursor = end;
    }
    return out + esc(text.slice(cursor));
  }

  function haystack(entry) {
    entry.hay ??= fold([
      entry.id, entry.location, entry.description, entry.temporal, entry.notes, entry.category, entry.certainty,
      ...entry.places.map(id => places.get(id).title), ...entry.areas.map(id => areas.get(id).title),
      ...entry.citations.flatMap(citation => [citation.label, DATA.passages[citation.id]]),
    ].join('\n'));
    return entry.hay;
  }

  // Citations

  function numberRanges(values) {
    const spans = [];
    for (const value of [...new Set(values)].sort((a, b) => a - b)) {
      const last = spans.at(-1);
      if (last && last[1] + 1 === value) last[1] = value;
      else spans.push([value, value]);
    }
    return spans.map(([start, end]) => start === end ? `${start}` : `${start}–${end}`).join(', ');
  }

  function citationText(entry) {
    const groups = [];
    for (const citation of entry.citations) {
      const last = groups.at(-1);
      if (last && last.book === citation.book && last.chapter === citation.chapter) last.items.push(citation);
      else groups.push({book: citation.book, chapter: citation.chapter, items: [citation]});
    }
    return groups.map(({book, chapter, items}) => {
      const where = chapterOf(book, chapter).epilogue ? 'Epilogue' : `ch. ${chapter}`;
      const pages = numberRanges(items.flatMap(c => Array.from({length: c.pageEnd - c.pageStart + 1}, (_, i) => c.pageStart + i)));
      const paragraphs = numberRanges(items.map(c => c.paragraph).filter(Boolean));
      return `Book ${book}, ${where}, “${chapterOf(book, chapter).title}”, ref p. ${pages}${paragraphs ? `, ¶${paragraphs}` : ''}`;
    }).join('; ');
  }

  const fullCitation = entry => `${citationText(entry)}. ${books.get(entry.book).title}; ref250-v1 reference pages; catalogue record ${entry.id}.`;
  const readerHref = citation => `../reader/book-${String(citation.book).padStart(2, '0')}.html#${citation.id}`;
  const pageSpan = citation => citation.pageStart === citation.pageEnd ? `${citation.pageStart}` : `${citation.pageStart}–${citation.pageEnd}`;

  // Filtering

  function applyFilters() {
    terms = parseTerms(filters.q);
    for (const entry of entries) entry.textMatch = terms.every(term => haystack(entry).includes(term));
    visible = entries.filter(entry => passes(entry));
  }

  const passes = (entry, skip) => entry.textMatch
    && (skip === 'books' || !filters.books.size || filters.books.has(entry.book))
    && (skip === 'cats' || !filters.cats.size || filters.cats.has(entry.category))
    && (skip === 'certs' || !filters.certs.size || filters.certs.has(entry.certainty));

  const filtering = () => Boolean(filters.q || filters.books.size || filters.cats.size || filters.certs.size);

  function facetCounts(facet, keyOf) {
    const counts = new Map();
    for (const entry of entries) if (passes(entry, facet)) counts.set(keyOf(entry), (counts.get(keyOf(entry)) ?? 0) + 1);
    return counts;
  }

  // URLs

  function queryString(extra = {}) {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.books.size) params.set('book', [...filters.books].sort().join(','));
    if (filters.cats.size) params.set('cat', [...filters.cats].sort().join(','));
    if (filters.certs.size) params.set('ev', [...filters.certs].sort().join(','));
    for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value);
    const text = params.toString();
    return text ? `?${text}` : '';
  }

  const panelParam = () => panel.entry ? `${panel.entry},${panel.scope}` : null;
  const link = path => `#${path}${queryString()}`;

  function routePath() {
    if (route.view === 'about') return '/about';
    if (route.view === 'areas') return ['/areas', route.area, route.place].filter(Boolean).join('/');
    return ['/books', route.book, route.chapter].filter(Boolean).join('/');
  }

  const currentHash = (entry = currentEntry) => `#${routePath()}${queryString({entry, panel: panelParam()})}`;
  const replaceUrl = () => history.replaceState(null, '', currentHash());

  function readRoute() {
    const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
    const [view, first, second] = path.split('/').filter(Boolean);
    const params = new URLSearchParams(query);
    const list = name => (params.get(name) ?? '').split(',').filter(Boolean);
    filters.q = params.get('q') ?? '';
    filters.books = new Set(list('book').map(Number));
    filters.cats = new Set(list('cat'));
    filters.certs = new Set(list('ev'));
    const next = {view: ['books', 'areas', 'about'].includes(view) ? view : 'books', entry: params.get('entry')};
    if (next.view === 'books') {
      next.book = books.has(Number(first)) ? Number(first) : null;
      next.chapter = next.book && chapterOf(next.book, Number(second)) ? Number(second) : null;
    }
    if (next.view === 'areas') {
      next.area = areas.has(first) ? first : null;
      next.place = places.has(second) ? second : null;
    }
    const [panelEntry, panelScope] = (params.get('panel') ?? '').split(',');
    if (byId.has(panelEntry)) Object.assign(panel, {entry: panelEntry, scope: panelScope});
    return next;
  }

  const renderKey = () => [route.view, route.area, filters.q, [...filters.books].sort(), [...filters.cats].sort(), [...filters.certs].sort()].join('|');

  // Entry cards

  function passageHtml(entry) {
    let out = '';
    let previous = null;
    for (const citation of entry.citations) {
      if (previous) {
        if (previous.book !== citation.book || previous.chapter !== citation.chapter) {
          out += `<p class="passage-gap">${esc(chapterName(citation.book, citation.chapter))}: ${esc(chapterOf(citation.book, citation.chapter).title)}</p>`;
        } else if (citation.paragraph !== previous.paragraph + 1) {
          out += '<p class="passage-gap" title="Paragraphs between these are not part of this description">⋯</p>';
        }
      }
      out += `<div class="para"><a class="para-ref" href="${readerHref(citation)}" target="_blank">¶${citation.paragraph ?? '–'}<span title="Project reference page, not a print page">ref ${pageSpan(citation)}</span></a><p>${highlight(DATA.passages[citation.id])}</p></div>`;
      previous = citation;
    }
    return out;
  }

  function passageBlock(entry) {
    if (!quoted) return '';
    const long = entry.words > LONG_PASSAGE_WORDS;
    return `<div class="passage${long ? ' long' : ''}"><p class="passage-label">Source text · ${plural(entry.words, 'word')}</p>${passageHtml(entry)}${long ? '<button class="passage-more" data-action="expand">Show whole passage</button>' : ''}</div>`;
  }

  function placeChip(entry, id) {
    const place = places.get(id);
    const others = placeEntries.get(id).length - 1;
    const hint = place.kind === 'group' ? 'A group of similar locations, not one room' : 'Show other descriptions of this place';
    return `<button class="place-chip kind-${place.kind}" data-action="panel" data-entry="${entry.id}" data-scope="place:${id}" title="${others ? hint : 'The only description filed here'}" ${others ? '' : 'disabled'}><span>${esc(place.title)}</span><b>${others ? `+${number(others)}` : 'none'}</b></button>`;
  }

  // Skipped cards take this height until the browser lays them out, which keeps the scrollbar honest.
  const estimatedHeight = entry => (quoted ? 256 + Math.ceil(entry.words / 12.5) * 27 + entry.citations.length * 13 : 217)
    + Math.ceil((entry.description.length + entry.notes.length + entry.temporal.length) / 80) * 21;

  function card(entry, seen) {
    const first = !seen.has(entry.id);
    seen.add(entry.id);
    const category = CATEGORIES.find(([key]) => key === entry.category);
    const certainty = CERTAINTIES.find(([key]) => key === entry.certainty);
    return `<article class="entry" data-entry="${entry.id}" ${first ? `id="e-${entry.id}"` : ''} style="contain-intrinsic-block-size:auto ${estimatedHeight(entry)}px">
<header class="entry-head">
  <p class="entry-index"><a class="entry-id" href="#/books?entry=${entry.id}" title="Open this entry in book order">${highlight(entry.id)}</a> <span>No. ${number(entry.seq)} of ${number(entries.length)}</span></p>
  <p class="entry-tags"><span class="tag category cat-${entry.category}" title="${esc(category[2])}">${category[1]}</span><span class="tag certainty cert-${entry.certainty}" title="${esc(certainty[2])}">${certainty[1]}</span></p>
</header>
<h4 class="entry-title">${highlight(entry.location)}</h4>
<div class="entry-places"><span class="row-label">Other descriptions</span>${entry.places.map(id => placeChip(entry, id)).join('')}</div>
<p class="entry-summary">${highlight(entry.description)}</p>
${passageBlock(entry)}
<dl class="meta">
  <div><dt>Citation</dt><dd>${esc(citationText(entry))} <button class="text-button" data-action="copy" data-entry="${entry.id}">Copy</button></dd></div>
  <div><dt>State</dt><dd>${highlight(entry.temporal)}</dd></div>
  <div><dt>Model note</dt><dd>${highlight(entry.notes)}</dd></div>
  <div><dt>Area</dt><dd>${entry.areas.map(id => `<a href="${link(`/areas/${id}`)}">${esc(areas.get(id).title)}</a>`).join(' · ')}</dd></div>
</dl>
<details class="locators" data-entry="${entry.id}"><summary>Exact locators (${entry.citations.length})</summary></details>
</article>`;
  }

  function locatorTable(entry) {
    const rows = entry.citations.map(c => `<tr><td>${quoted ? `<a href="${readerHref(c)}" target="_blank">${c.id}</a>` : c.id}</td><td>${pageSpan(c)}</td><td>${esc(c.member)} · ${esc(c.element)} (${esc(c.slot)})</td></tr>`);
    return `<table><thead><tr><th>Paragraph</th><th>Ref page</th><th>EPUB source</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
  }

  // Views

  function resultBar(noun) {
    const shown = filtering() ? `<strong>${number(visible.length)}</strong> of ${number(entries.length)} descriptions match` : `<strong>${number(entries.length)}</strong> descriptions ${noun}`;
    const clear = filtering() ? ' <button class="text-button" data-action="clear-filters">Clear filters</button>' : '';
    const edition = quoted ? '' : ' Unofficial fan catalogue: paraphrases and citations, not the novels’ text.';
    return `<p class="result-bar">${shown}.${clear}${edition}</p>`;
  }

  const emptyState = () => '<div class="empty"><h2>No descriptions match</h2><p>Try fewer words, or clear the filters.</p><button class="button" data-action="clear-filters">Clear filters</button></div>';

  function bookOrderView() {
    if (!visible.length) return emptyState();
    const seen = new Set();
    let out = resultBar('in book order');
    let book = null;
    let chapter = null;
    const counts = new Map();
    for (const entry of visible) counts.set(`${entry.book}:${entry.chapter}`, (counts.get(`${entry.book}:${entry.chapter}`) ?? 0) + 1);
    for (const entry of visible) {
      if (entry.book !== book || entry.chapter !== chapter) {
        if (chapter !== null) out += '</section>';
        if (entry.book !== book) {
          if (book !== null) out += '</section>';
          book = entry.book;
          const title = books.get(book);
          out += `<section class="book" id="book-${book}"><header class="book-head"><p class="kicker">Book ${book}</p><h2>${esc(title.title)}</h2></header>`;
        }
        chapter = entry.chapter;
        out += `<section class="chapter" id="chapter-${book}-${chapter}" data-spy="chapter-${book}-${chapter}"><h3 class="chapter-head"><span class="chapter-book">Book ${book}</span> ${esc(chapterName(book, chapter))}: ${esc(chapterOf(book, chapter).title)} <small>${counts.get(`${book}:${chapter}`)}</small></h3>`;
      }
      out += card(entry, seen);
    }
    return `${out}</section></section>`;
  }

  function areaIndexView() {
    if (!visible.length) return emptyState();
    const tiles = DATA.areas.map(area => {
      const count = areaEntries.get(area.id).filter(entry => passes(entry)).length;
      if (!count) return '';
      const inArea = DATA.places.filter(place => place.area === area.id);
      const names = inArea.slice(0, 6).map(place => esc(place.title)).join(' · ');
      return `<a class="area-tile" href="${link(`/areas/${area.id}`)}"><h3>${esc(area.title)}</h3><p class="area-count">${plural(count, 'description')} · ${plural(inArea.length, 'place')}</p><p class="area-places">${names}${inArea.length > 6 ? ' …' : ''}</p></a>`;
    });
    return `<header class="view-intro"><h2>Browse by area</h2><p>Areas are broad navigation groups and they overlap. Being in one area does not mean two rooms are the same or adjacent.</p></header>${resultBar('across all areas')}<div class="area-grid">${tiles.join('')}</div>`;
  }

  function placeSection(place, seen) {
    const all = placeEntries.get(place.id).filter(entry => passes(entry));
    if (!all.length) return '';
    const main = all.filter(entry => entry.places[0] === place.id);
    const also = all.filter(entry => entry.places[0] !== place.id);
    const byBook = list => {
      let out = '';
      let book = null;
      for (const entry of list) {
        if (entry.book !== book) {
          book = entry.book;
          out += `<p class="book-divider">Book ${book} · ${esc(books.get(book).shortTitle)}</p>`;
        }
        out += card(entry, seen);
      }
      return out;
    };
    const badge = place.kind === 'group' ? '<span class="kind-badge" title="Similar locations gathered for navigation. This does not claim they are one room.">Group</span>' : '';
    const alsoHtml = also.length ? `<details class="also"${filtering() || !main.length ? ' open' : ''}><summary>${plural(also.length, 'description')} mainly about somewhere else that also ${also.length === 1 ? 'covers' : 'cover'} this place</summary>${byBook(also)}</details>` : '';
    return `<section class="place-section" id="place-${place.id}" data-spy="place-${place.id}"><header class="place-head"><h3>${esc(place.title)} ${badge}</h3><p>${esc(place.scope)}</p><p class="place-count">${number(main.length)} mainly here${also.length ? `, ${number(also.length)} also here` : ''}</p></header>${byBook(main)}${alsoHtml}</section>`;
  }

  function areaView(area) {
    const seen = new Set();
    const sections = DATA.places.filter(place => place.area === area.id).map(place => placeSection(place, seen)).join('');
    const links = DATA.places.filter(place => place.area === area.id && placeEntries.get(place.id).some(entry => passes(entry)))
      .map(place => `<a href="${link(`/areas/${area.id}/${place.id}`)}">${esc(place.title)}</a>`).join('');
    const count = areaEntries.get(area.id).filter(entry => passes(entry)).length;
    return `<header class="view-intro"><p class="kicker"><a href="${link('/areas')}">All areas</a></p><h2>${esc(area.title)}</h2><p>${plural(count, 'description')}${filtering() ? ' match' : ''}, in book order within each place.${filtering() ? ' <button class="text-button" data-action="clear-filters">Clear filters</button>' : ''}</p><nav class="place-links" aria-label="Places in this area">${links}</nav></header>${sections || emptyState()}`;
  }

  function aboutView() {
    const definitions = rows => `<dl class="definitions">${rows.map(([, label, text]) => `<div><dt>${label}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl>`;
    const {meta} = DATA;
    return `<article class="about">
<h2>About this site</h2>
<p>This site gathers every description of Hogwarts and its surroundings recorded in the catalogue, ${quoted ? 'alongside' : 'with a citation to'} the book paragraphs each one rests on. There are ${number(entries.length)} descriptions, reviewed against all ${number(meta.paragraphs)} paragraphs of the seven novels.</p>
<h3>Reference pages</h3>
<p>The ebook has no print-page map, so page numbers here are project reference pages (${esc(meta.pagination.scheme)}): ${meta.pagination.words_per_page} narrative words per page, restarting in each book. They do not match any printed edition. Paragraph numbers and IDs such as <code>B01-C007-P0012</code> identify the exact source text${quoted ? ', and each ¶ link opens that paragraph in the full-text reader' : ''}.</p>
<h3>Index numbers</h3>
<p>A record ID such as <code>B01-023</code> is the catalogue’s stable identifier. “No. 23 of ${number(entries.length)}” is the description’s position in book order. Chapters show the chapter of a description’s first cited paragraph.</p>
<h3>Categories</h3>${definitions(CATEGORIES)}
<h3>Evidence</h3>${definitions(CERTAINTIES)}
<h3>Places, groups and areas</h3>
<p>Almost every location label is unique to its scene, so descriptions are also filed under ${number(places.size)} named places. A <strong>place</strong> is one location the text treats as the same, in any state. A <strong>group</strong>, shown with a dashed outline, gathers similar locations or a school-wide subject and does not claim they are one room. Unnamed rooms stay in groups rather than being matched to a likely named room.</p>
<p>A description can be filed under up to four places. The first is its main subject; the others are places it also covers, such as the far end of a route. <strong>Areas</strong> are broader groups of places, for navigation only.</p>
<h3>Keyboard</h3>
<dl class="definitions keys">
  <div><dt><kbd>/</kbd></dt><dd>Search</dd></div>
  <div><dt><kbd>j</kbd> <kbd>k</kbd></dt><dd>Next or previous description</dd></div>
  <div><dt><kbd>o</kbd></dt><dd>Open or close other descriptions of this place</dd></div>
  <div><dt><kbd>[</kbd> <kbd>]</kbd></dt><dd>Earlier or later description of the open place</dd></div>
  <div><dt><kbd>Esc</kbd></dt><dd>Close the side panel, or clear the search</dd></div>
</dl>
${quoted ? `<h3>Local only</h3>
<p>The site quotes ${number(meta.quotedWords)} words from your copy of the novels, so it is generated under the ignored <code>build/</code> folder and stays out of Git.</p>` : `<h3>No book text</h3>
<p>Entries are paraphrases with citations, so this edition does not contain the novels’ text. To read a passage, go to the cited book and chapter in your own copy. The catalogue was compiled from the British English Pottermore ebooks, and other editions can differ in wording.</p>
<h3>Unofficial</h3>
<p>This is an unofficial, non-commercial fan project, not affiliated with or endorsed by J.K. Rowling, her publishers or Warner Bros. Harry Potter names and characters belong to their owners. The <a href="https://github.com/KenDJohnson/hogwarts-model">source and method are on GitHub</a>.</p>`}
</article>`;
  }

  // Sidebar

  function facet(name, label, items) {
    return `<div class="facet" role="group" aria-label="${label}"><p class="facet-label">${label}</p><div class="pills">${items.join('')}</div></div>`;
  }

  function pill(name, value, text, count, title = '') {
    const active = filters[name].has(value);
    return `<button class="pill" data-action="filter" data-facet="${name}" data-value="${value}" aria-pressed="${active}" ${title ? `title="${esc(title)}"` : ''}>${text}${count === undefined ? '' : `<span>${number(count)}</span>`}</button>`;
  }

  function filtersHtml() {
    const bookCounts = facetCounts('books', entry => entry.book);
    const catCounts = facetCounts('cats', entry => entry.category);
    const certCounts = facetCounts('certs', entry => entry.certainty);
    return `<section class="filters" aria-label="Filters">
${facet('books', 'Book', DATA.books.map(book => pill('books', book.number, book.number, undefined, `${book.title}: ${number(bookCounts.get(book.number) ?? 0)}`)))}
${facet('cats', 'Category', CATEGORIES.map(([key, label, text]) => pill('cats', key, label, catCounts.get(key) ?? 0, text)))}
${facet('certs', 'Evidence', CERTAINTIES.map(([key, label, text]) => pill('certs', key, label, certCounts.get(key) ?? 0, text)))}
${quoted ? `<label class="switch"><input type="checkbox" data-action="collapse" ${document.body.classList.contains('collapse-long') ? 'checked' : ''}> Collapse long passages</label>` : ''}
</section>`;
  }

  function bookTree() {
    const counts = new Map();
    for (const entry of visible) {
      counts.set(entry.book, (counts.get(entry.book) ?? 0) + 1);
      counts.set(`${entry.book}:${entry.chapter}`, (counts.get(`${entry.book}:${entry.chapter}`) ?? 0) + 1);
    }
    return `<nav class="tree" aria-label="Books and chapters"><ol>${DATA.books.filter(book => counts.has(book.number)).map(book => {
      const items = book.chapters.filter(chapter => counts.has(`${book.number}:${chapter.number}`)).map(chapter =>
        `<li><a class="tree-link" data-target="chapter-${book.number}-${chapter.number}" href="${link(`/books/${book.number}/${chapter.number}`)}"><span class="tree-title">${chapter.epilogue ? '' : `${chapter.number}. `}${esc(chapter.title)}</span><span class="count">${counts.get(`${book.number}:${chapter.number}`)}</span></a></li>`);
      return `<li class="tree-group"><a class="tree-link tree-top" href="${link(`/books/${book.number}`)}"><span class="tree-title"><b>${book.number}</b> ${esc(book.shortTitle)}</span><span class="count">${number(counts.get(book.number))}</span></a><ol>${items.join('')}</ol></li>`;
    }).join('')}</ol></nav>`;
  }

  function areaTree() {
    return `<nav class="tree" aria-label="Areas and places"><ol>${DATA.areas.map(area => {
      const count = areaEntries.get(area.id).filter(entry => passes(entry)).length;
      if (!count) return '';
      const items = DATA.places.filter(place => place.area === area.id).map(place => {
        const inPlace = placeEntries.get(place.id).filter(entry => passes(entry)).length;
        return inPlace ? `<li><a class="tree-link" data-target="place-${place.id}" href="${link(`/areas/${area.id}/${place.id}`)}"><span class="tree-title">${esc(place.title)}</span><span class="count">${number(inPlace)}</span></a></li>` : '';
      });
      return `<li class="tree-group${route.area === area.id ? ' open' : ''}"><a class="tree-link tree-top${route.area === area.id ? ' current' : ''}" href="${link(`/areas/${area.id}`)}"><span class="tree-title">${esc(area.title)}</span><span class="count">${number(count)}</span></a><ol>${items.join('')}</ol></li>`;
    }).join('')}</ol></nav>`;
  }

  function setActiveSection(key) {
    $$('.tree-link.active', sidebar).forEach(item => item.classList.remove('active'));
    const target = $(`[data-target="${key}"]`, sidebar);
    if (!target) return;
    target.classList.add('active');
    if (route.view === 'books') $$('.tree-group', sidebar).forEach(group => group.classList.toggle('open', group.contains(target)));
    const box = sidebar.getBoundingClientRect();
    const place = target.getBoundingClientRect();
    if (place.top < box.top + 40 || place.bottom > box.bottom - 40) sidebar.scrollTop += place.top - box.top - box.height / 3;
  }

  let spy = null;
  function watchSections() {
    spy?.disconnect();
    spy = new IntersectionObserver(items => {
      for (const item of items) if (item.isIntersecting) setActiveSection(item.target.dataset.spy);
    }, {rootMargin: '-22% 0px -76% 0px'});
    $$('[data-spy]', content).forEach(section => spy.observe(section));
  }

  // Rendering

  function renderAll() {
    applyFilters();
    if (route.view === 'about') content.innerHTML = aboutView();
    else if (route.view === 'areas') content.innerHTML = route.area ? areaView(areas.get(route.area)) : areaIndexView();
    else content.innerHTML = bookOrderView();
    sidebar.innerHTML = route.view === 'about' ? '' : filtersHtml() + (route.view === 'areas' ? areaTree() : bookTree());
    layout.classList.toggle('no-sidebar', route.view === 'about');
    $('#nav-books').href = link('/books');
    $('#nav-areas').href = link('/areas');
    $('#brand').href = link('/books');
    $$('.view-switch a, .about-link').forEach(item => item.removeAttribute('aria-current'));
    $(`#nav-${route.view}`).setAttribute('aria-current', 'page');
    if (document.activeElement !== search) search.value = filters.q;
    watchSections();
    renderedKey = renderKey();
  }

  // Cards take their real height only as they come near the screen, which moves
  // the target. Keep aligning until it holds still.
  let landing = 0;
  function landOn(element) {
    const attempt = ++landing;
    let frames = 0;
    let last = null;
    const align = () => {
      if (attempt !== landing) return;
      element.scrollIntoView({block: 'start'});
      const top = element.getBoundingClientRect().top;
      if (top === last || ++frames > 30) return;
      last = top;
      requestAnimationFrame(align);
    };
    align();
  }

  let flashed = null;
  function scrollToEntry(id, flash = true) {
    const element = document.getElementById(`e-${id}`);
    if (!element) return false;
    for (let group = element.closest('details'); group; group = group.parentElement?.closest('details')) group.open = true;
    landOn(element);
    currentEntry = id;
    if (flash) {
      flashed?.classList.remove('flash');
      void element.offsetWidth;
      element.classList.add('flash');
      flashed = element;
    }
    return true;
  }

  function scrollForRoute(viewChanged) {
    if (route.entry && scrollToEntry(route.entry)) return;
    let target = null;
    if (route.view === 'books') target = route.chapter ? `chapter-${route.book}-${route.chapter}` : route.book ? `book-${route.book}` : null;
    if (route.view === 'areas' && route.place) target = `place-${route.place}`;
    const element = target && document.getElementById(target);
    if (element) element.scrollIntoView({block: 'start'});
    else if (viewChanged) scrollTo(0, 0);
  }

  function closeDrawer() {
    document.body.classList.remove('sidebar-open');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
  }

  function onRoute() {
    const previousView = `${route.view}:${route.area}`;
    route = readRoute();
    if (route.view === 'about') panel.entry = null;
    if (renderKey() !== renderedKey) renderAll();
    renderPanel();
    scrollForRoute(previousView !== `${route.view}:${route.area}`);
    closeDrawer();
    document.title = route.view === 'about' ? 'About · Hogwarts descriptions'
      : route.area ? `${areas.get(route.area).title} · Hogwarts descriptions` : 'Hogwarts descriptions';
  }

  function filtersChanged() {
    const anchor = currentEntry;
    renderAll();
    renderPanel();
    if (filters.q || !anchor || !scrollToEntry(anchor, false)) scrollTo(0, 0);
    replaceUrl();
  }

  // Side panel

  const scopeParts = scope => [scope.slice(0, scope.indexOf(':')), scope.slice(scope.indexOf(':') + 1)];

  function scopeEntries(scope) {
    const [kind, id] = scopeParts(scope);
    return kind === 'place' ? placeEntries.get(id) : areaEntries.get(id);
  }

  function isMainSubject(entry, scope) {
    const [kind, id] = scopeParts(scope);
    return (kind === 'place' ? entry.places[0] : entry.areas[0]) === id;
  }

  const panelList = () => scopeEntries(panel.scope).filter(entry => !panel.mainOnly || entry.id === panel.entry || isMainSubject(entry, panel.scope));

  function fullListHref(scope) {
    const [kind, id] = scopeParts(scope);
    return link(kind === 'place' ? `/areas/${places.get(id).area}/${id}` : `/areas/${id}`);
  }

  function panelTab(scope) {
    const [kind, id] = scopeParts(scope);
    const title = kind === 'place' ? places.get(id).title : `All of ${areas.get(id).title}`;
    const active = scope === panel.scope;
    return `<button class="panel-tab${kind === 'area' ? ' area' : ''}" data-action="scope" data-scope="${scope}" aria-pressed="${active}">${esc(title)}<span>${number(scopeEntries(scope).length)}</span></button>`;
  }

  function miniRow(entry) {
    const source = entry.id === panel.entry;
    const first = entry.citations[0];
    return `<details class="mini${source ? ' is-source' : ''}" data-entry="${entry.id}"><summary>
<span class="mini-meta"><span class="dot cat-${entry.category}" title="${esc(entry.category)}"></span>${esc(chapterOf(entry.book, entry.chapter).epilogue ? 'Epilogue' : `ch. ${entry.chapter}`)} · ref p. ${first.pageStart} · ${entry.id}${source ? '<em>This entry</em>' : ''}</span>
<span class="mini-title">${esc(entry.location)}</span><span class="mini-summary">${esc(entry.description)}</span></summary></details>`;
  }

  function miniBody(entry) {
    return `<div class="mini-body">${quoted ? `<div class="passage">${passageHtml(entry)}</div>` : ''}<p class="mini-note">${esc(citationText(entry))}</p><p class="mini-note">State: ${esc(entry.temporal)}</p><p class="mini-actions"><a href="#/books?entry=${entry.id}" data-action="show-entry" data-entry="${entry.id}">Go to this entry</a><button class="text-button" data-action="copy" data-entry="${entry.id}">Copy citation</button></p></div>`;
  }

  function renderPanel() {
    $$('.entry.is-source').forEach(item => item.classList.remove('is-source'));
    $$('.place-chip.active').forEach(item => item.classList.remove('active'));
    const entry = byId.get(panel.entry);
    const wasOpen = !panelElement.hidden;
    if (!entry) {
      panelElement.hidden = true;
      panelElement.innerHTML = '';
      layout.classList.remove('panel-open');
      return;
    }
    const scopes = [...entry.places.map(id => `place:${id}`), ...entry.areas.map(id => `area:${id}`)];
    if (!scopes.includes(panel.scope)) panel.scope = scopes.find(scope => scopeEntries(scope).length > 1) ?? scopes[0];
    const [kind, id] = scopeParts(panel.scope);
    const subject = kind === 'place' ? places.get(id) : areas.get(id);
    const all = scopeEntries(panel.scope);
    const mainCount = all.filter(item => isMainSubject(item, panel.scope)).length;
    const bookCount = new Set(all.map(item => item.book)).size;
    const list = panelList();
    const position = list.findIndex(item => item.id === panel.entry);
    const kicker = kind === 'area' ? 'Same area' : subject.kind === 'group' ? 'Related, not one room' : 'Same place';
    let rows = '';
    let book = null;
    for (const item of list) {
      if (item.book !== book) {
        if (book !== null) rows += '</section>';
        book = item.book;
        rows += `<section class="panel-book"><h3>Book ${book} <span>${esc(books.get(book).shortTitle)}</span></h3>`;
      }
      rows += miniRow(item);
    }
    panelElement.innerHTML = `<header class="panel-head">
<div class="panel-top"><p class="kicker">${kicker}</p><button class="icon-button" data-action="close-panel" aria-label="Close side panel">✕</button></div>
<h2 tabindex="-1">${esc(subject.title)}</h2>
${subject.scope ? `<p class="panel-scope">${esc(subject.scope)}</p>` : ''}
<p class="panel-stats">${plural(all.length, 'description')} in ${plural(bookCount, 'book')}, ${number(mainCount)} mainly about it</p>
${scopes.length > 1 ? `<div class="panel-tabs" role="group" aria-label="Show descriptions of">${scopes.map(panelTab).join('')}</div>` : ''}
<div class="panel-tools">
<div class="stepper"><button class="button" data-action="step-place" data-direction="-1" ${position > 0 ? '' : 'disabled'} title="Previous description of this place ([)">‹ Earlier</button><button class="button" data-action="step-place" data-direction="1" ${position < list.length - 1 ? '' : 'disabled'} title="Next description of this place (])">Later ›</button></div>
<label class="switch"><input type="checkbox" data-action="main-only" ${panel.mainOnly ? 'checked' : ''}> Main subject only</label>
<button class="text-button" data-action="expand-all">${EXPAND_ALL[0]}</button>
<a class="panel-full" href="${esc(fullListHref(panel.scope))}">Open as full list</a>
</div></header>
<div class="panel-list">${rows}</section></div>`;
    panelElement.hidden = false;
    layout.classList.add('panel-open');
    const sourceCard = document.getElementById(`e-${entry.id}`);
    sourceCard?.classList.add('is-source');
    $$('.place-chip', sourceCard ?? panelElement).filter(chip => chip.dataset.scope === panel.scope).forEach(chip => chip.classList.add('active'));
    const scroller = $('.panel-list', panelElement);
    const sourceRow = $('.mini.is-source', panelElement);
    if (sourceRow) scroller.scrollTop += sourceRow.getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientHeight / 4;
    if (!wasOpen) $('h2', panelElement).focus({preventScroll: true});
  }

  // Run a layout change without moving the given card on screen.
  function keepInPlace(anchor, change) {
    const top = anchor?.getBoundingClientRect().top;
    change();
    if (anchor) scrollBy(0, anchor.getBoundingClientRect().top - top);
  }

  function openPanel(id, scope, anchor = document.getElementById(`e-${id}`)) {
    keepInPlace(anchor, () => {
      Object.assign(panel, {entry: id, scope});
      renderPanel();
    });
    replaceUrl();
  }

  function closePanel() {
    const source = document.getElementById(`e-${panel.entry}`);
    const chip = source && $('.place-chip.active', source);
    keepInPlace(source, () => {
      panel.entry = null;
      renderPanel();
    });
    chip?.focus({preventScroll: true});
    replaceUrl();
  }

  function showEntry(id) {
    if (panel.entry) panel.entry = id;
    if (document.getElementById(`e-${id}`)) {
      history.pushState(null, '', currentHash(id));
      scrollToEntry(id);
      renderPanel();
      return;
    }
    // The entry is not on this page: open it in book order, dropping any filter that hides it.
    if (!passes(byId.get(id))) {
      filters.q = '';
      filters.books.clear();
      filters.cats.clear();
      filters.certs.clear();
    }
    location.hash = `/books${queryString({entry: id, panel: panelParam()})}`;
  }

  function stepInPlace(direction) {
    if (!panel.entry) return;
    const list = panelList();
    const next = list[list.findIndex(item => item.id === panel.entry) + direction];
    if (next) showEntry(next.id);
  }

  function stepEntry(direction) {
    const cards = $$('.entry', content).filter(item => item.offsetParent !== null);
    const position = cards.findIndex(item => item.dataset.entry === currentEntry);
    const next = cards[Math.max(0, position + direction)];
    if (next) scrollToEntry(next.dataset.entry);
  }

  // Tracks the description at the top of the screen, for j/k and for resuming from the URL.
  let urlTimer = null;
  let scrollQueued = false;
  function trackPosition() {
    scrollQueued = false;
    const box = content.getBoundingClientRect();
    const header = $('.site-header').getBoundingClientRect().bottom;
    const item = document.elementFromPoint(box.left + box.width / 2, header + 90)?.closest('.entry');
    if (!item || item.dataset.entry === currentEntry) return;
    currentEntry = item.dataset.entry;
    clearTimeout(urlTimer);
    urlTimer = setTimeout(replaceUrl, 500);
  }

  // Actions

  async function copyCitation(entry) {
    const text = fullCitation(entry);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    const toast = $('#toast');
    toast.textContent = 'Citation copied';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
  }

  function clearFilters() {
    filters.q = '';
    filters.books.clear();
    filters.cats.clear();
    filters.certs.clear();
    search.value = '';
    filtersChanged();
  }

  function remember(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  const ACTIONS = {
    skip: () => content.focus(),
    menu: button => button.setAttribute('aria-expanded', document.body.classList.toggle('sidebar-open')),
    theme() {
      const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = dark ? 'light' : 'dark';
      remember('hogwarts-theme', document.documentElement.dataset.theme);
    },
    filter(button) {
      const set = filters[button.dataset.facet];
      const value = button.dataset.facet === 'books' ? Number(button.dataset.value) : button.dataset.value;
      if (!set.delete(value)) set.add(value);
      filtersChanged();
    },
    'clear-filters': clearFilters,
    panel: button => openPanel(button.dataset.entry, button.dataset.scope, button.closest('.entry')),
    'close-panel': closePanel,
    scope(button) {
      panel.scope = button.dataset.scope;
      renderPanel();
      replaceUrl();
    },
    'step-place': button => stepInPlace(Number(button.dataset.direction)),
    'expand-all'(button) {
      const rows = $$('.mini', panelElement);
      const open = rows.some(row => !row.open);
      rows.forEach(row => { row.open = open; });
      button.textContent = EXPAND_ALL[open ? 1 : 0];
    },
    'show-entry'(element, event) {
      event.preventDefault();
      showEntry(element.dataset.entry);
    },
    copy: button => copyCitation(byId.get(button.dataset.entry)),
    expand(button) {
      button.parentElement.classList.toggle('expanded');
      button.textContent = button.parentElement.classList.contains('expanded') ? 'Collapse passage' : 'Show whole passage';
    },
  };

  document.addEventListener('click', event => {
    const actor = event.target.closest('[data-action]');
    if (actor && ACTIONS[actor.dataset.action] && actor.type !== 'checkbox') {
      ACTIONS[actor.dataset.action](actor, event);
      return;
    }
    const anchor = event.target.closest('a[href^="#/"]');
    if (anchor && anchor.getAttribute('href') === location.hash) {
      event.preventDefault();
      scrollForRoute(false);
      closeDrawer();
    }
  });

  document.addEventListener('change', event => {
    const action = event.target.dataset?.action;
    if (action === 'collapse') {
      document.body.classList.toggle('collapse-long', event.target.checked);
      remember('hogwarts-collapse', event.target.checked ? '1' : '');
    }
    if (action === 'main-only') {
      panel.mainOnly = event.target.checked;
      renderPanel();
    }
  });

  // <details> toggles do not bubble, so these listen in the capture phase.
  document.addEventListener('toggle', event => {
    const item = event.target;
    if (!item.open || item.dataset.filled || !item.dataset?.entry) return;
    const entry = byId.get(item.dataset.entry);
    if (item.matches('.mini')) item.insertAdjacentHTML('beforeend', miniBody(entry));
    else if (item.matches('.locators')) item.insertAdjacentHTML('beforeend', locatorTable(entry));
    else return;
    item.dataset.filled = '1';
  }, true);

  let searchTimer = null;
  search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (search.value.trim() === filters.q) return;
      filters.q = search.value.trim();
      filtersChanged();
    }, 140);
  });

  addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Escape') {
      if (event.target === search && search.value) {
        search.value = '';
        filters.q = '';
        filtersChanged();
      } else if (document.body.classList.contains('sidebar-open')) {
        closeDrawer();
      } else if (panel.entry) {
        closePanel();
      }
      return;
    }
    if (event.target.matches('input:not([type="checkbox"]), textarea, select')) return;
    const keys = {
      '/': () => { search.focus(); search.select(); },
      j: () => stepEntry(1),
      k: () => stepEntry(-1),
      '[': () => stepInPlace(-1),
      ']': () => stepInPlace(1),
      o() {
        if (panel.entry) closePanel();
        else if (currentEntry) openPanel(currentEntry, `place:${byId.get(currentEntry).places[0]}`);
      },
    };
    if (keys[event.key]) {
      event.preventDefault();
      keys[event.key]();
    }
  });

  addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(trackPosition);
  }, {passive: true});

  // Reader input wins over any alignment still settling after a jump.
  for (const type of ['wheel', 'touchstart']) addEventListener(type, () => { landing++; }, {passive: true});

  addEventListener('hashchange', onRoute);

  try { document.body.classList.toggle('collapse-long', Boolean(localStorage.getItem('hogwarts-collapse'))); } catch {}
  document.body.classList.toggle('paraphrased', !quoted);
  if (!quoted) search.placeholder = 'Search descriptions, places, notes';
  onRoute();
})();
