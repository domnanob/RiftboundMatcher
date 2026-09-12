# Riftbound Match tracker

A dark-mode, Hextech/League of Legends–styled match point tracker built for tabletop games of **Riftbound TCG** (or any two-player, points-to-win game). Designed mobile-first for a single phone laid flat on the table between two players: each side of the screen faces its own player, champion splash art forms the background, points are tracked with a hold-for-the-win button (or, in the base game, a two-battlefields button), a stopwatch tracks how long the match runs, and a dice roll-off settles who goes first.

> Unofficial fan project. Not affiliated with or endorsed by Riot Games.

## Features

- **Face-to-face match screen** — the screen splits into two panels (stacked in portrait, side-by-side in landscape). One panel is rotated 180° so that when the phone lies flat on the table, each player reads *their own* score right-side up from their side of the table — no more craning your neck to read an upside-down number.
- **Pick your Legend, not a name** — instead of typing player names, each side picks a Riftbound champion from a searchable picker (`champions.js` ships ~40 champions). The chosen champion's name becomes that side's label, and its splash art becomes that panel's background.
- **Base game rule (first to 8)** — the default game caps normal scoring at 7 points. The 8th, decisive point can only be claimed with the **HOLD** button or the **2 BATTLEFIELDS** button — both unlock once a side reaches 7. Tapping +1 past 7 just shakes the score as a reminder. Pick any other "first to" target (7 / 9 / 10 / custom) and it's a plain, uncapped race to that number instead.
- **Tap-to-score** — the +1 button and the big score number itself both add a point, giving you a large, easy target on a phone. A small undo link fixes mis-taps.
- **Match stopwatch** — no fixed game length to configure; a clock in the shared center strip counts up from the moment the match starts, so you always know how long the game has been running. The final time is shown again on the winner screen.
- **Dice roll-off** — roll a die for each side to decide who picks first, available from both the setup screen and mid-match.
- **Match menu** — reset scores or head back to setup (with a confirm step, since it discards the current game) from a single menu button, keeping the two score panels as large as possible.
- **Rematch / New Match** — quickly replay with the same champions and settings, or return to setup for a fresh match.

## Adding real champion splash art

Every champion gets a themed color-crest background out of the box (no external images, no network dependency), generated from `champions.js`. To use real artwork instead, drop an image into `assets/champions/` named after the champion's id — for example `assets/champions/jinx.jpg` for Jinx, or `assets/champions/master-yi-wuju-master.jpg` for the second Master Yi entry. Check `champions.js` for the exact `id`/`art` path of each entry. No code changes needed — the picker, the setup-screen buttons, and the match panels all pick up the file automatically once it exists; if it's missing, the crest gradient shows through instead.

## File structure

```
index.html      Page structure/markup for the setup and match screens
style.css       All visual styling, animations, and the Hextech theme
champions.js    The champion roster (name, title, accent color, art path)
components.js   Reusable Modal base class + Winner, Dice Roll-off, Confirm,
                Champion Picker, and Match Menu modal components
script.js       App state, scoring logic, stopwatch, and event wiring
assets/champions/  Optional local splash-art images (see above)
```

Keep all files in the same folder — `index.html` loads `style.css`, `champions.js`, `components.js`, and `script.js` via relative paths.

## Running it

No build step or server required. Open `index.html` directly in a modern browser (Chrome, Firefox, Safari, Edge). Optimized for phones; desktop/tablet works too but is a secondary concern.

## Tech

- Plain HTML/CSS/JavaScript — no framework or build tools
- [Tailwind CSS](https://tailwindcss.com/) via the CDN Play script, plus a small custom stylesheet for the Hextech theme, animations, and the face-to-face match layout
- Google Fonts: [Cinzel](https://fonts.google.com/specimen/Cinzel) (display) and [Spectral](https://fonts.google.com/specimen/Spectral) (body)

## Credits

Made by **domnanob**.
