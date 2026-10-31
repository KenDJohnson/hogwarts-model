#!/usr/bin/env node
// Drives the built site in headless Chrome from its file:// URL, with real input
// events, and checks the behaviour a reader relies on. Needs the ebook-derived
// build, so it is not part of `nix flake check`:
//
//   python scripts/build_site.py && node tests/site_smoke.mjs
//
// Screenshots land in build/site-screens/. Set CHROME to use another binary.
import {spawn} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = pathToFileURL(join(ROOT, 'build/site/index.html')).href;
const SCREENS = join(ROOT, 'build/site-screens');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

class Browser {
  async launch() {
    this.profile = mkdtempSync(join(tmpdir(), 'hogwarts-smoke-'));
    this.process = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${this.profile}`, '--remote-debugging-port=0', 'about:blank'], {stdio: ['ignore', 'ignore', 'pipe']});
    const port = await new Promise((done, fail) => {
      let log = '';
      this.process.stderr.on('data', chunk => {
        log += chunk;
        const match = log.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
        if (match) done(match[1]);
      });
      this.process.on('exit', code => fail(new Error(`Chrome exited (${code}): ${log}`)));
    });
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    this.socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise(done => this.socket.addEventListener('open', done));
    this.next = 0;
    this.pending = new Map();
    this.errors = [];
    this.socket.addEventListener('message', ({data}) => {
      const message = JSON.parse(data);
      if (message.id) {
        const {done, fail} = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) fail(new Error(JSON.stringify(message.error)));
        else done(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        this.errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
      } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        this.errors.push(`${message.params.entry.text} ${message.params.entry.url ?? ''}`);
      } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        this.errors.push(JSON.stringify(message.params.args.map(arg => arg.value)));
      }
    });
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Log.enable');
  }

  send(method, params = {}) {
    const id = ++this.next;
    this.socket.send(JSON.stringify({id, method, params}));
    return new Promise((done, fail) => this.pending.set(id, {done, fail}));
  }

  async size(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile});
  }

  async open(hash = '') {
    await this.send('Page.navigate', {url: 'about:blank'});
    await this.send('Page.navigate', {url: PAGE + hash});
    await this.until("document.querySelector('.entry, .area-tile, .about, .empty') !== null");
  }

  async hash(hash) {
    await this.eval(`location.hash = ${JSON.stringify(hash)}`);
    await this.settle();
  }

  async eval(expression) {
    const {result, exceptionDetails} = await this.send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    if (exceptionDetails) throw new Error(`${expression}\n${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    return result.value;
  }

  async until(expression, timeout = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await this.eval(expression)) return;
      await new Promise(done => setTimeout(done, 25));
    }
    throw new Error(`Timed out waiting for: ${expression}`);
  }

  // Two frames and a beat: lets rendering and the scroll tracker catch up.
  async settle(ms = 120) {
    await this.eval('new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))');
    await new Promise(done => setTimeout(done, ms));
  }

  async click(selector) {
    const box = await this.eval(`(() => {
      const element = [...document.querySelectorAll(${JSON.stringify(selector)})].find(item => item.getClientRects().length);
      if (!element) return null;
      element.scrollIntoViewIfNeeded();
      const rect = element.getBoundingClientRect();
      return {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2};
    })()`);
    if (!box) throw new Error(`Nothing to click: ${selector}`);
    await this.send('Input.dispatchMouseEvent', {type: 'mouseMoved', ...box});
    await this.send('Input.dispatchMouseEvent', {type: 'mousePressed', button: 'left', clickCount: 1, ...box});
    await this.send('Input.dispatchMouseEvent', {type: 'mouseReleased', button: 'left', clickCount: 1, ...box});
    await this.settle();
  }

  async key(key) {
    const text = key.length === 1 ? key : undefined;
    await this.send('Input.dispatchKeyEvent', {type: 'keyDown', key, text, windowsVirtualKeyCode: key === 'Escape' ? 27 : undefined});
    await this.send('Input.dispatchKeyEvent', {type: 'keyUp', key});
    await this.settle();
  }

  async type(text) {
    await this.send('Input.insertText', {text});
    await this.settle(260);
  }

  async screenshot(name) {
    const {data} = await this.send('Page.captureScreenshot', {format: 'png'});
    writeFileSync(join(SCREENS, `${name}.png`), Buffer.from(data, 'base64'));
  }

  close() {
    this.socket?.close();
    this.process?.kill();
    setTimeout(() => rmSync(this.profile, {recursive: true, force: true}), 300);
  }
}

let failures = 0;
function check(name, passed, detail = '') {
  console.log(`${passed ? 'ok  ' : 'FAIL'} ${name}${detail === '' ? '' : ` — ${detail}`}`);
  if (!passed) failures++;
}

const browser = new Browser();
mkdirSync(SCREENS, {recursive: true});
await browser.launch();
const page = browser;

try {
  // Chronological view
  await page.size(1500, 1000);
  await page.open();
  await page.until("performance.getEntriesByType('navigation')[0].loadEventEnd > 0");
  const load = await page.eval("Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd)");
  check('all entries render', await page.eval("document.querySelectorAll('.entry').length") === 1380);
  check('loads quickly', load < 2500, `${load} ms to loaded`);
  check('seven books in order', await page.eval("[...document.querySelectorAll('.book')].map(item => item.id).join()") === 'book-1,book-2,book-3,book-4,book-5,book-6,book-7');
  check('entries follow catalogue order', await page.eval("[...document.querySelectorAll('.entry')].every((item, i) => item.dataset.entry === HOGWARTS_DATA.entries[i].id)"));
  const first = await page.eval(`(() => {
    const card = document.querySelector('.entry');
    const entry = HOGWARTS_DATA.entries[0];
    return {
      quote: card.querySelector('.para p').textContent === HOGWARTS_DATA.passages[entry.citations[0].id],
      citation: card.querySelector('.meta dd').textContent,
      index: card.querySelector('.entry-index').textContent,
      tags: card.querySelector('.entry-tags').textContent,
      state: card.textContent.includes(entry.temporal),
      note: card.textContent.includes(entry.notes),
    };
  })()`);
  check('card quotes the actual text', first.quote);
  check('card shows citation', first.citation.includes('Book 1, ch. 4, “The Keeper of the Keys”, ref p. 57, ¶107'), first.citation);
  check('card shows the index', first.index.includes('B01-001') && first.index.includes('No. 1 of 1,380'), first.index);
  check('card shows categorisation', first.tags.includes('History') && first.tags.includes('Reported'), first.tags);
  check('card shows state and model note', first.state && first.note);
  await page.screenshot('chronological');

  // Unrendered cards use an estimated height; a poor estimate makes the scrollbar jump.
  const estimated = await page.eval('document.documentElement.scrollHeight');
  await page.eval("document.querySelectorAll('.entry').forEach(item => { item.style.contentVisibility = 'visible'; })");
  const actual = await page.eval('document.documentElement.scrollHeight');
  const spread = await page.eval(`(() => {
    const heights = [...document.querySelectorAll('.entry')].map(item => item.getBoundingClientRect().height);
    return {mean: Math.round(heights.reduce((a, b) => a + b) / heights.length), max: Math.round(Math.max(...heights))};
  })()`);
  check('height estimate is close', Math.abs(estimated - actual) / actual < 0.05, `${estimated} estimated, ${actual} actual, card mean ${spread.mean}px max ${spread.max}px`);
  await page.open();

  // Jumps land on the right card even though most cards have not been laid out yet.
  await page.hash('#/books?entry=B05-147');
  const landed = await page.eval("document.getElementById('e-B05-147').getBoundingClientRect().top");
  check('deep link lands on the entry', landed > 40 && landed < 160, `top ${Math.round(landed)}px`);
  check('sticky heading shows the chapter', await page.eval("document.querySelector('.tree-link.active')?.textContent.length > 0"));
  check('entry tracked as current', await page.eval("location.hash.includes('B05-147')"));

  // Same-place panel, from the chronological view
  const before = await page.eval("document.getElementById('e-B05-147').getBoundingClientRect().top");
  await page.click('#e-B05-147 .place-chip');
  const after = await page.eval("document.getElementById('e-B05-147').getBoundingClientRect().top");
  check('panel opens', await page.eval("!document.getElementById('panel').hidden"));
  check('panel names the place', await page.eval("document.querySelector('#panel h2').textContent") === 'Gryffindor common room');
  check('opening the panel keeps the reading position', Math.abs(after - before) < 2, `moved ${Math.round(after - before)}px`);
  check('panel lists every description of the place', await page.eval("document.querySelectorAll('#panel .mini').length === HOGWARTS_DATA.entries.filter(e => e.places.includes('gryffindor-common-room')).length"));
  check('panel marks this entry', await page.eval("document.querySelector('#panel .mini.is-source').dataset.entry") === 'B05-147');
  check('source row is scrolled into view', await page.eval(`(() => {
    const list = document.querySelector('.panel-list').getBoundingClientRect();
    const row = document.querySelector('#panel .mini.is-source').getBoundingClientRect();
    return row.top >= list.top && row.bottom <= list.bottom;
  })()`));
  await page.screenshot('same-place-panel');

  await page.click('#panel .mini:not(.is-source) summary');
  check('expanding a row shows the text', await page.eval("document.querySelector('#panel .mini[open] .para p')?.textContent.length > 0"));
  await page.click('#panel .mini[open] [data-action="show-entry"]');
  const jumped = await page.eval("document.querySelector('#panel .mini.is-source').dataset.entry");
  check('go to entry moves the list and keeps the panel', jumped !== 'B05-147' && await page.eval(`location.hash.includes(${JSON.stringify(jumped)})`), jumped);
  check('jumped card is on screen', await page.eval(`(() => { const top = document.getElementById('e-${jumped}').getBoundingClientRect().top; return top > 0 && top < innerHeight; })()`));
  await page.eval('history.back()');
  await page.until("location.hash.includes('B05-147') || !location.hash.includes('entry=')");
  await page.settle(250);
  check('back returns to the earlier entry', await page.eval("Math.abs(document.getElementById('e-B05-147').getBoundingClientRect().top) < 300"));

  await page.hash('#/books?entry=B05-147');
  await page.click('#e-B05-147 .place-chip');
  const positions = await page.eval(`(() => {
    const rows = [...document.querySelectorAll('#panel .mini')].map(row => row.dataset.entry);
    return {rows, at: rows.indexOf(document.querySelector('#panel .mini.is-source').dataset.entry)};
  })()`);
  await page.click('[data-action="step-place"][data-direction="1"]');
  check('later steps to the next description here', await page.eval("document.querySelector('#panel .mini.is-source').dataset.entry") === positions.rows[positions.at + 1]);
  await page.key('[');
  check('[ steps back', await page.eval("document.querySelector('#panel .mini.is-source').dataset.entry") === positions.rows[positions.at]);

  const allRows = await page.eval("document.querySelectorAll('#panel .mini').length");
  await page.click('[data-action="main-only"]');
  const mainRows = await page.eval("document.querySelectorAll('#panel .mini').length");
  check('main subject filter narrows the list', mainRows < allRows && mainRows > 1, `${allRows} to ${mainRows}`);
  await page.click('[data-action="main-only"]');
  await page.click('.panel-tab.area');
  check('area tab widens to the area', await page.eval("document.querySelector('#panel .kicker').textContent") === 'Same area');
  await page.key('Escape');
  check('escape closes the panel', await page.eval("document.getElementById('panel').hidden"));

  // A closed panel stays closed: links rendered while it was open must not reopen it.
  await page.hash('#/books?entry=B05-147');
  await page.click('#e-B05-147 .place-chip');
  await page.click('[data-facet="certs"][data-value="explicit"]');
  await page.key('Escape');
  check('closing the panel returns focus to its chip', await page.eval("document.activeElement.classList.contains('place-chip')"));
  await page.click('.tree-group:not(.open) .tree-link');
  check('a closed panel stays closed after navigating', await page.eval("document.getElementById('panel').hidden"));
  await page.click('[data-facet="certs"][data-value="explicit"]');

  await page.hash('#/books?entry=B05-147');
  await page.click('#e-B05-147 .place-chip');
  await page.click('.panel-full');
  await page.until("location.hash.startsWith('#/areas/gryffindor/gryffindor-common-room')");
  await page.settle(250);
  check('full list opens the place in the area view', await page.eval("Math.abs(document.getElementById('place-gryffindor-common-room').getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom) < 90"));
  await page.key('Escape');

  // A description alone in its place says so instead of offering an empty list.
  await page.hash('#/books?entry=B02-064');
  check('a lone description says there are no others', await page.eval("document.querySelector('#e-B02-064 .place-chip').textContent.endsWith('none') && document.querySelector('#e-B02-064 .place-chip').disabled"));

  // Long passages can be collapsed and reopened one at a time.
  await page.hash('#/books?entry=B05-147');
  await page.click('[data-action="collapse"]');
  const collapsed = await page.eval("document.querySelector('#e-B05-147 .passage').getBoundingClientRect().height");
  await page.click('#e-B05-147 [data-action="expand"]');
  const expanded = await page.eval("document.querySelector('#e-B05-147 .passage').getBoundingClientRect().height");
  check('long passages collapse and expand', collapsed < 220 && expanded > collapsed * 1.5, `${Math.round(collapsed)} to ${Math.round(expanded)}px`);
  await page.click('#e-B05-147 [data-action="expand"]');
  await page.click('[data-action="collapse"]');
  await page.hash('#/books?entry=B02-010');
  await page.click('[data-action="collapse"]');
  await page.key('j');
  check('reading keys work after ticking a checkbox', await page.eval("document.querySelector('.entry.flash')?.dataset.entry !== 'B02-010'"));
  await page.click('[data-action="collapse"]');

  // A group must not read as one room.
  await page.hash('#/books?entry=B01-043');
  await page.click('#e-B01-043 .place-chip');
  check('groups are labelled as not one room', await page.eval("document.querySelector('#panel .kicker').textContent") === 'Related, not one room');
  await page.key('Escape');

  // Search
  await page.hash('#/books');
  await page.key('/');
  check('slash focuses search', await page.eval("document.activeElement.id") === 'search');
  await page.type("Filch's");
  const straight = await page.eval("document.querySelectorAll('.entry').length");
  check('straight apostrophe finds curly text', straight > 0 && straight < 1380, `${straight} results`);
  check('matches are highlighted', await page.eval("document.querySelectorAll('.entry mark').length") > 0);
  check('result count is shown', await page.eval("document.querySelector('.result-bar').textContent").then(text => text.includes(`${straight} of 1,380`)));
  await page.screenshot('search');
  await page.key('Escape');
  check('escape clears the search', await page.eval("document.querySelectorAll('.entry').length") === 1380);
  await page.type('"marble staircase"');
  const phrase = await page.eval("document.querySelectorAll('.entry').length");
  check('quoted phrase search works', phrase > 0 && phrase < 300, `${phrase} results`);
  await page.key('Escape');
  await page.type('halloween');
  check('halloween finds Hallowe’en', await page.eval("document.querySelectorAll('.entry').length") > 5);
  await page.key('Escape');
  await page.type('zzzznothing');
  check('no results shows an empty state', await page.eval("document.querySelector('.empty') !== null"));
  await page.click('.empty [data-action="clear-filters"]');
  check('clear filters restores everything', await page.eval("document.querySelectorAll('.entry').length") === 1380);

  // Filters
  await page.eval("document.activeElement.blur()");
  await page.click('[data-facet="books"][data-value="3"]');
  await page.click('[data-facet="cats"][data-value="grounds"]');
  const filtered = await page.eval("[...document.querySelectorAll('.entry')].map(item => item.querySelector('.tag.category').textContent + item.dataset.entry.slice(0, 3))");
  check('book and category filters combine', filtered.length > 0 && filtered.every(item => item === 'GroundsB03'), `${filtered.length} results`);
  check('filters reach the URL', await page.eval("location.hash.includes('book=3') && location.hash.includes('cat=grounds')"));
  await page.click('[data-action="clear-filters"]');

  // Keyboard reading
  await page.hash('#/books?entry=B02-010');
  await page.key('j');
  check('j moves to the next description', await page.eval("document.querySelector('.entry.flash')?.dataset.entry === HOGWARTS_DATA.entries[HOGWARTS_DATA.entries.findIndex(e => e.id === 'B02-010') + 1].id"));
  await page.key('o');
  check('o opens the panel for the current entry', await page.eval("!document.getElementById('panel').hidden"));
  await page.key('o');
  check('o closes it again', await page.eval("document.getElementById('panel').hidden"));

  // Area view
  await page.hash('#/areas');
  check('area index lists all areas', await page.eval("document.querySelectorAll('.area-tile').length") === 28);
  await page.screenshot('areas');
  await page.click('.area-tile[href*="great-hall"]');
  check('area page opens', await page.eval("document.querySelector('.view-intro h2').textContent") === 'Great Hall and adjoining rooms');
  check('area groups entries by place', await page.eval("document.querySelectorAll('.place-section').length") === 2);
  await page.click('[data-facet="certs"][data-value="reported"]');
  await page.click('.view-intro [data-action="clear-filters"]');
  check('an area page can clear its filters', await page.eval("document.querySelectorAll('.place-section').length === 2 && !location.hash.includes('ev=')"));
  check('entries sit in book order within a place', await page.eval(`[...document.querySelectorAll('#place-great-hall > .entry')].every((item, i, all) => !i || HOGWARTS_DATA.entries.findIndex(e => e.id === all[i - 1].dataset.entry) < HOGWARTS_DATA.entries.findIndex(e => e.id === item.dataset.entry))`));
  check('passing mentions are tucked away', await page.eval("document.querySelector('#place-great-hall .also').open === false"));
  await page.screenshot('area-page');
  await page.click('.tree-link[data-target="place-great-hall-side-chamber"]');
  check('place link scrolls to the place', await page.eval("Math.abs(document.getElementById('place-great-hall-side-chamber').getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom) < 90"));
  await page.hash('#/areas/gryffindor?entry=B05-147');
  check('deep link into an area', await page.eval("Math.abs(document.getElementById('e-B05-147').getBoundingClientRect().top) < 300"));
  check('every area shows its records', await page.eval("HOGWARTS_DATA.areas.every(area => HOGWARTS_DATA.entries.some(e => e.areas.includes(area.id)))"));
  await page.hash('#/areas/kitchens?entry=B01-081');
  check('deep link opens a tucked-away entry', await page.eval("document.getElementById('e-B01-081').closest('details').open"));
  await page.click('#e-B01-081 .place-chip[data-scope="place:corridors-general"]');
  await page.click('#panel .mini:not(.is-source) summary');
  const outside = await page.eval("document.querySelector('#panel .mini[open]').dataset.entry");
  await page.click('#panel .mini[open] [data-action="show-entry"]');
  await page.until(`location.hash.startsWith('#/books') && document.getElementById('e-${outside}') !== null`);
  await page.settle(250);
  check('an entry outside the area opens in book order', await page.eval(`Math.abs(document.getElementById('e-${outside}').getBoundingClientRect().top) < 300 && !document.getElementById('panel').hidden`));
  await page.key('Escape');

  // Reload keeps the place
  await page.open('#/books?entry=B07-136&panel=B07-136,place:gryffindor-boys-dormitory');
  await page.settle(300);
  check('reloading restores entry and panel', await page.eval("!document.getElementById('panel').hidden && document.querySelector('#panel .mini.is-source').dataset.entry === 'B07-136'"));
  check('reloading lands on the entry', await page.eval("Math.abs(document.getElementById('e-B07-136').getBoundingClientRect().top) < 300"));
  await page.key('Escape');

  // Reader links resolve from file://
  const reader = await page.eval("document.querySelector('.para-ref').href");
  check('source link points at a built reader page', reader.includes('/build/reader/book-') && existsSync(fileURLToPath(reader.split('#')[0])), reader.split('/build/')[1]);

  // About
  await page.click('#nav-about');
  check('about page explains reference pages', await page.eval("document.querySelector('.about').textContent.includes('ref250-v1')"));

  // Dark theme and small screens
  await page.hash('#/books?entry=B01-014');
  await page.click('[data-action="theme"]');
  await page.click('#e-B01-014 .place-chip');
  await page.screenshot('dark');
  await page.key('Escape');
  await page.click('[data-action="theme"]');

  await page.size(1100, 800);
  await page.hash('#/books?entry=B01-014');
  await page.click('#e-B01-014 .place-chip');
  check('medium window hides the sidebar for the panel', await page.eval("getComputedStyle(document.getElementById('sidebar')).display === 'none'"));
  await page.screenshot('medium');
  await page.key('Escape');

  await page.size(390, 844, true);
  await page.hash('#/books?entry=B01-014');
  check('no sideways scrolling on a phone', await page.eval("document.documentElement.scrollWidth <= innerWidth"));
  check('phone header holds its contents', await page.eval(`(() => {
    const header = document.querySelector('.site-header').getBoundingClientRect();
    return ['.brand', '.view-switch', '.search'].every(selector => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return box.top >= header.top && box.bottom <= header.bottom && box.left >= 0 && box.right <= innerWidth;
    });
  })()`));
  await page.screenshot('phone');
  await page.click('#e-B01-014 .place-chip');
  check('phone panel covers the screen', await page.eval("document.getElementById('panel').getBoundingClientRect().width >= 380"));
  await page.screenshot('phone-panel');
  await page.key('Escape');
  await page.click('.menu-toggle');
  check('phone menu opens', await page.eval("getComputedStyle(document.getElementById('sidebar')).display !== 'none'"));
  await page.screenshot('phone-menu');

  check('no console errors', browser.errors.length === 0, browser.errors.slice(0, 5).join(' | '));
} catch (error) {
  failures++;
  console.log(`FAIL ${error.stack}`);
  await page.screenshot('failure').catch(() => {});
} finally {
  browser.close();
}
console.log(failures ? `\n${failures} failed` : '\nAll passed');
setTimeout(() => process.exit(failures ? 1 : 0), 500);
