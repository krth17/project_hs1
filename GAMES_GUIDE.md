# Play & Learn: guide for building games

This is the reference for every game in this folder. Read it before adding or
changing a game, and update it when a rule changes. Each rule is here for a
reason, and most reasons are written next to the rule.

---

## 1. What this site is

- Small learning games, worksheets and quizzes for **young children**: early
  readers and the first years of arithmetic.
- **Static files only.** It must run on a free GitHub Pages account: HTML, CSS
  and plain JavaScript, with no server, build step, npm, framework or
  database. Every page must also work when opened straight from disk
  (`file://`), so a page can't use `fetch()` or ES modules. Put data in
  `<script>` files.
- **Phones first.** Most players use a phone or tablet held by a child. Laptops
  and desktops must work too, ideally with the keyboard only.
- No accounts, ads, tracking or external calls. No web fonts are needed, and
  the font stack falls back to the system fonts.

## 2. Folder layout

```
index.html          home page: modern, neutral style; one card per game
GAMES_GUIDE.md      this file
.nojekyll           tells GitHub Pages to serve files as they are
assets/
  kit.css           the playful game theme: tokens and components (game pages)
  kit.js            shared helpers: settings, setup page, timer, DOM (game pages)
  words.js          word bank for Word Search
  arith.css         styles for the arithmetic drill games
  arith.js          shared engine for Addition and Subtraction
wordsearch.html     game: Word Search
addition.html       game: Addition (thin page + arith.js)
subtraction.html    game: Subtraction (thin page + arith.js)
```

- One game is one top-level `name.html`, so its URL stays short.
- When several games share an engine, put the engine in `assets/<engine>.js`
  and keep each page thin (like Addition and Subtraction).
- Large data such as word lists goes in `assets/*.js` as `window.SOMETHING = …`.
- All links and paths are **relative** (`assets/kit.css`, `index.html`), so the
  site works at `user.github.io/repo/`.

## 3. Look and feel

The site has **two looks**:

- **Home page (`index.html`): modern and neutral.** Parents and teachers see
  it first, so it should look like a clean, current product page and not like
  a toy. Its styles are in the page's own `<style>` block, and it doesn't load
  `kit.css`.
  - Off-white or white surfaces with thin borders and soft shadows, and one
    indigo accent.
  - System sans-serif font (`Inter`/`system-ui`), regular weight, with
    semibold headings.
  - Follows the device's **dark mode** (`prefers-color-scheme`).
  - Line icons are inline SVG. Each game's emoji appears only in a small
    tinted square on its card.
- **Game pages: each game picks its own theme to suit its players.** The games
  so far are for small children, so they use the **playful theme** in
  `kit.css`, described below. A game for older children can use a calmer
  theme: either override the tokens in that page's `<style>`, or add an
  `assets/<theme>.css`. Keep the page anatomy, the settings flow and the input
  rules the same in every theme.

### The playful theme (`kit.css`)

**Mood:** warm, bright, friendly and uncluttered. It should look like a
sticker book, not a dashboard.

| Token (in `kit.css`) | Value | Use |
|---|---|---|
| `--bg` | `#fff7e8` cream | page background |
| `--card` | white | cards, buttons, grid cells |
| `--ink` | `#2b2d42` | text |
| `--accent` | `#ff6b4a` coral | the one main action on a screen |
| `--good` / `--good-bg` | green | correct |
| `--bad` / `--bad-bg` | red | wrong |
| `--focus` | blue | keyboard focus ring |

- The playful theme is light only, on purpose.
- Use the rounded system font stack (`--font`) at weight 800–900 for headings
  and numbers.
- **Emoji are the icons.** Don't use icon fonts or image files. Each game has
  one emoji, which appears on its tile, its title and its favicon.
- **Tap targets are at least 44 px; main buttons are 52–60 px tall.** Use the
  `.btn`, `.btn.primary`, `.btn.big` and `.icon-btn` classes.
- Keep text short. Children may not read well, so use an emoji with a few
  words: "⭐ Correct, first try!", "👆 12 taps left".
- Feedback is instant and visible: green with a pop for right answers, red
  with a shake for wrong ones (`Kit.flash(el, 'pop' | 'shake')`). Never say
  anything discouraging; "Not quite, try again!" is the strongest wording.
- Respect `prefers-reduced-motion` (handled globally in `kit.css`).
- Pages must not scroll sideways at 320 px wide. The `main` element has a
  16 px gutter.

### Page anatomy (every game page)

```
┌──────────────────────────────────┐
│ 🏠      🔍 Game Title         ⚙️ │  .bar (sticky): Home, title, settings
├──────────────────────────────────┤
│  [pill] [pill] [pill]            │  .pills: level, ⏱ time, score, …
│                                  │
│         game area                │  <main id="app">, filled by JS
│                                  │
└──────────────────────────────────┘
```

- **Favicon = the game's emoji.** Copy this line and change only the emoji:

  ```html
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔍</text></svg>">
  ```
- `<title>` is the game name. `<meta name="viewport">` and
  `<meta name="theme-color" content="#fff7e8">` are always present.

## 4. Home page (`index.html`)

- The page has a top bar (brand), a short hero, then a **"Games" grid of
  cards**: one column on a phone, two or three on wider screens.
- **Clicking anywhere on a card starts the game at once with default
  settings.** The title link is stretched over the whole card with `::after`.
- **The small "Settings" button in the card's corner opens that game's
  settings page** (`game.html?setup`). It sits above the stretched link.
- Each card has a description of one or two sentences that mentions the main
  options, plus one or two subject tags (Reading, Spelling, Arithmetic,
  Timed, …).
- Each card's icon square has a pastel tint set with `style="--tint:#……"`,
  which is automatically muted in dark mode. Used so far: `#fde9c4`,
  `#d3f2df`, `#d6e6ff`. Good next ones: `#fbd5e5`, `#e4dcff`, `#fdf3b0`,
  `#ccf1ee`.

Card markup (copy one `<article class="game">` from `index.html` and edit it):

```html
<article class="game" style="--tint:#fbd5e5">
  <div class="game-top">
    <div class="game-icon" aria-hidden="true">🧩</div>
    <a class="settings" href="mygame.html?setup" aria-label="My Game settings">
      <svg …sliders icon…></svg>
      Settings
    </a>
  </div>
  <h3><a class="game-link" href="mygame.html">My Game</a></h3>
  <p>One or two sentences: what the child does, and the main options.</p>
  <div class="game-foot">
    <div class="tags"><span>Subject</span><span>Timed</span></div>
    <span class="play" aria-hidden="true">Play <svg …arrow…></svg></span>
  </div>
</article>
```

## 5. How settings work (same for every game)

- Each game declares a **settings schema**. Every setting is a short list of
  choices, shown as big tap-able buttons:

  ```js
  const SCHEMA = [
    { key: 'level', label: 'Level', default: '1', options: [
      { value: '1', label: 'Level 1', hint: '5-letter words' },
      { value: '2', label: 'Level 2', hint: '6-letter words' } ] },
    { key: 'list', label: 'Show the list of words?', default: 'yes', options: [
      { value: 'yes', label: '👀 Yes' }, { value: 'no', label: '🙈 No' } ] }
  ];
  ```
- **Settings live in the URL**, for example `wordsearch.html?level=2&list=no`.
  That makes Replay, bookmarks and shared links keep the settings. A missing
  or invalid value falls back to the default.
- `game.html?setup` shows the settings page, which `Kit.renderSetup` builds.
  Its **▶ Start** button goes to `game.html?<settings>`.
- The settings page starts with the settings in the URL if there are any.
  Otherwise it uses the choices the child made last time on this device
  (localStorage), and otherwise the defaults. A tile tap always uses defaults.
- When settings depend on each other, pass `adjust(values, changedKey)`. It
  fixes the values and returns a short note to show. Subtraction uses it so the
  second number is never longer than the first.
- Prefer a small number of settings. Each one should change difficulty or
  presentation in a way a parent would understand.

Standard bootstrap at the top of a game script:

```js
const app = document.getElementById('app');
const init = Kit.readSettings(SCHEMA);
Kit.wireHeader(init.settings);          // ⚙️ in the bar opens settings pre-filled
if (init.setup) {
  Kit.renderSetup(app, { id: 'mygame', title: 'My Game settings', emoji: '🧩', schema: SCHEMA, initial: init });
  return;
}
start(init.settings);
```

## 6. Game flow conventions

1. **Start fast.** A tile tap goes straight into play. The one exception is a
   game that needs typing on a phone: it shows a single **▶ Start** button
   first, because phones only open the keyboard after a tap.
2. **During play** show pills for the level or mode, a running ⏱ timer, and
   the score or what's left (taps, questions, stars).
3. **End of game** shows a results card or screen with:
   - a big emoji (🎉 / ⭐ / 💪 / 🏆),
   - the main score and the **total time**,
   - details as a table if there were several questions (`table.results`
     inside `.table-wrap`),
   - **🔁 Replay** as the primary button, with keyboard focus on it. It starts
     a new round with **the same settings** and without reloading the page,
   - **🏠 Home / Main screen** as the secondary button.
4. Show the answers the child missed in the results (for example, missed
   words are circled in red). Mistakes are part of learning.
5. Timer: `Kit.stopwatch()`, refreshed every 200–250 ms, and shown with
   `Kit.fmtTime` (`12.3 s`, then `1:05`).

## 7. Input rules

### Typing answers (number drills, spelling, …)

- Use **one `<input>` that stays focused the whole game.** Never destroy or
  blur it between questions, or the phone keyboard closes.
- Numbers: `type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" enterkeyhint="go"`.
  This shows the number pad. Strip non-digits on `input`.
- When an answer can be negative, phone number pads often have **no minus
  key**. Show a **±** button above ↵ that toggles a leading `-`, and also
  accept a typed `-` on desktop.
- The input font must be at least 16 px, or iOS zooms in.
- **Enter, then Enter again:** the first Enter checks the answer, and after a
  correct answer the next Enter moves on. Put the input in a `<form>` so the
  phone's "Go" key works too.
- The iPhone number pad has no Enter key, so always show a big **↵** button
  next to the input.
- Every button shown near the input calls `Kit.keepFocus(btn)` so tapping it
  doesn't close the keyboard.
- **Desktop is keyboard-only:** digits, `Enter` to check or go on, `Esc` to
  end. Results screen: `Enter` replays (focus is on Replay), `Tab` reaches Home.
- Wrong answer: clear the box, shake it, and let the child try again. Count
  tries; "right first try" is the main score.

### Tapping things on screen (grids, cards, pictures)

- Mouse: one click selects.
- **Touch: press and hold (~350 ms)** selects. The cell grows and turns
  yellow while held. This stops accidental taps from scrolling or brushing the
  screen, which matters when taps are limited. Letting go too early shows a
  gentle hint, and moving the finger more than ~12 px cancels.
- Use pointer events (`pointerdown`, `pointermove`, `pointerup`,
  `pointercancel`) and check `e.pointerType`. Set
  `touch-action: manipulation`, `user-select: none` and
  `-webkit-touch-callout: none` on the board, and block `contextmenu`.
- Tapping something that is already solved costs nothing.

## 8. Kit API (`assets/kit.js`)

| Function | What it does |
|---|---|
| `Kit.h(tag, attrs, ...children)` | Creates an element. `on*` attrs become listeners, `true` becomes an empty attribute, and `false`/`null` are skipped. |
| `Kit.$(sel, root?)` | `querySelector` |
| `Kit.flash(el, cls)` | Restarts a one-shot animation class (`'pop'`, `'shake'`, or your own). |
| `Kit.keepFocus(...buttons)` | Stops those buttons from taking focus away from the input. |
| `Kit.randInt(lo, hi)` / `Kit.pick(arr)` / `Kit.shuffle(arr)` | Random helpers (inclusive range; Fisher–Yates shuffle). |
| `Kit.stopwatch()` | `{ reset(), stop() → ms, ms() }` |
| `Kit.fmtTime(ms)` | `"12.3 s"` or `"1:05"` |
| `Kit.store.get/set(key, value)` | localStorage, wrapped so failures are ignored. Use it only for conveniences such as remembering the last settings. |
| `Kit.readSettings(schema)` | `{ settings, fromUrl, setup }` read from the URL |
| `Kit.query(settings)` | `"?a=1&b=2"` |
| `Kit.wireHeader(settings)` | Points the bar's ⚙️ (`id="gear"`) at the pre-filled settings page. |
| `Kit.renderSetup(root, game)` | Builds the settings page. `game = { id, title, emoji, schema, initial, adjust? }` |
| `Kit.isTouch()` | True when the main pointer is coarse (a finger). |

Shared CSS classes: `.bar .icon-btn .btn .primary .big .small .row .card
.center .muted .big-emoji .pills .pill .stat-cards .table-wrap table.results
.yes .no .shake .pop`.

## 9. Adding a new game: checklist

1. Choose the game's emoji and a pastel tile colour.
2. Copy a game page (`wordsearch.html` for tap games, `addition.html` for
   typing games). Change `<title>`, the favicon emoji and the bar title.
3. Write `SCHEMA` and its defaults. Use the standard bootstrap from §5.
4. Build play → end-of-game results → Replay (same settings) / Home (§6).
5. Follow the input rules in §7.
6. Add the card to `index.html` (§4).
7. Add a section about the game to §11 below.
8. Test it (§10).

## 10. Testing before publishing

- Open `index.html` straight from disk in Chrome or Edge. It must work with
  no server.
- In DevTools device mode, check iPhone SE (375 px) and a 320 px width: no
  sideways scroll, and the board fits.
- On a real phone, check that the keyboard opens on Start and **stays open**
  across many questions, that ↵ works, and that long-press works without
  bringing up the text-selection menu.
- On desktop, play a whole round using only the keyboard.
- Check that the settings in the URL survive Replay, and that ⚙️ opens the
  settings page pre-filled.
- Check that the favicon shows the game's emoji.

**Publishing:** push this folder to a GitHub repo, then turn on Settings →
Pages → *Deploy from branch* → `main` / root. The site appears at
`https://<user>.github.io/<repo>/`.

## 11. Games

### 🔍 Word Search (`wordsearch.html`)

- **Settings:**
  - `level` = 1 / 2 / 3 (default 1)
  - `list` = yes / no (default yes): show the word list
  - `diag` = yes / no (default **no**): diagonal words
  - `rev` = yes / no (default **no**): backwards words, read right to left
    and bottom to top

  | Level | Grid | Word length |
  |---|---|---|
  | 1 | 10 × 10 | 5 |
  | 2 | 12 × 12 | 6 |
  | 3 | 13 × 13 | 7–9 |
- Each puzzle hides **10 words**, chosen at random from the level's list in
  `assets/words.js`. The allowed directions depend on the settings:

  | diag | rev | Directions |
  |---|---|---|
  | no | no | → ↓ (default) |
  | yes | no | → ↓ ↘ |
  | no | yes | → ↓ ← ↑ |
  | yes | yes | all 8 |

  A pill above the grid shows the arrows in use. Words may cross where their
  letters match. No two words start on the same square, and the puzzle is
  rebuilt if a hidden word would accidentally appear twice in any direction.
- The child selects a word by clicking (or press-and-holding) its **first
  letter**. The whole word is then coloured, and its chip in the list is
  crossed out.
- **13 taps per puzzle.** Finding a word or missing both use a tap. Tapping
  letters of a word already found is free.
- When `list=no`, chips show `•••••` (only the length) until the word is
  found.
- The game ends when all 10 are found or the taps run out. The results card
  shows the time and the number found, circles the missed words in red, and
  offers 🔁 Replay (a new puzzle with the same settings) and 🏠 Home.
- To add words, edit `assets/words.js`. Words of the wrong length are skipped
  automatically, and each level needs at least ~30 words.

### ➕ Addition (`addition.html`) and ➖ Subtraction (`subtraction.html`)

- Both use the same engine, `assets/arith.js`, configured by
  `window.ARITH = { op, id, title, emoji }`.
- **Settings:** `a` = digits in the first number, `b` = digits in the second
  (1–5 each, default 1 and 1). A 1-digit number is 1–9. An n-digit number is
  10ⁿ⁻¹ to 10ⁿ−1.
- Subtraction only: `neg` = yes / no (default **no**) sets whether answers
  can go below zero.
  - `neg=no`: the bigger number is always on top (swapped if needed), and
    `b` can't have more digits than `a`.
  - `neg=yes`: the numbers are used as drawn, so about half the answers are
    negative when `a` and `b` are the same size. `b` may be longer than `a`.
    A **±** button and a typed `-` both enter the minus sign.
- Questions are shown as a **written sum**, stacked and right-aligned like on
  paper, with the answer box under the line.
- Flow: ▶ Start → question → type the answer → Enter. A wrong answer lets the
  child retry. A right answer shows ✓ (⭐ if it was the first try), and Enter
  goes to the next question. This repeats until **■ End** or `Esc`. The same
  question never appears twice in a row.
- **Results:** first-try correct out of answered, total time, average time
  per question, and a table with these columns: #, Question, Answer, First try
  (✓, or ✗ with what was typed first), Tries, Time. An unfinished last
  question isn't counted. Then 🔁 Replay (starts straight away with the same
  settings) and 🏠 Main screen.

## 12. Ideas and to-do

- (add here)
