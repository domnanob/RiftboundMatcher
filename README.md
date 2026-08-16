# Summoner's Tally

A dark-mode, Hextech/League of Legends–styled match point tracker built for tabletop games of **Riftbound TCG** (or any two-player, points-to-win game). Track points for a Blue Side and Red Side, hold for the win, run a game clock with sudden-death final rounds, and settle who goes first with a dice roll-off.

> Unofficial fan project. Not affiliated with or endorsed by Riot Games.

## Features

- **Setup screen** — enter both player names, pick points-to-win (7 / 8 / 9 / 10 or a custom value), and pick a game length (15 / 20 / 30 / 45 minutes or a custom value).
- **Hold-to-win scoring** — reaching the target score doesn't end the game automatically. Each side gets a **HOLD** button that only activates once their score is at or above the target; the game ends the moment either side taps Hold. If both sides are eligible, whoever holds first wins.
- **Game timer** — a countdown starts as soon as the match begins, shown in the header. It turns red in the final minute.
- **Final rounds (sudden death)** — when the timer hits zero, a modal explains that both sides get two more rounds to score or hold. If nobody holds by the end, the higher score wins; equal scores result in a draw.
- **Dice roll-off** — roll a die for each side to decide who picks first, available from both the setup screen and mid-match.
- **Confirm-before-leaving** — going "Back" to setup mid-match asks for confirmation first, since it discards the current game.
- **Rematch / New Match** — quickly replay with the same players and settings, or return to setup for a fresh match.

## File structure

```
index.html      Page structure/markup for the setup and match screens
style.css       All visual styling, animations, and the Hextech theme
components.js   Reusable Modal base class + Winner, Dice Roll-off,
                Confirm, and Final Rounds modal components
script.js       App state, scoring logic, timer, and event wiring
```

Keep all four files in the same folder — `index.html` loads `style.css`, `components.js`, and `script.js` via relative paths.

## Running it

No build step or server required. Open `index.html` directly in a modern browser (Chrome, Firefox, Safari, Edge).

## Tech

- Plain HTML/CSS/JavaScript — no framework or build tools
- [Tailwind CSS](https://tailwindcss.com/) via the CDN Play script, plus a small custom stylesheet for the Hextech theme, animations, and components
- Google Fonts: [Cinzel](https://fonts.google.com/specimen/Cinzel) (display) and [Spectral](https://fonts.google.com/specimen/Spectral) (body)

## Credits

Made by **domnanob**.
