/* ==========================================================
   Summoner's Tally — Champion roster
   Each entry is a selectable "Legend" for a side of the match.
   `art` points at an optional local splash-art file under
   assets/champions/ — drop a matching image there (same
   filename) and it is picked up automatically, no code changes
   needed. Until then, `accent` drives a generated Hextech-style
   crest background so every champion still looks good.
   ========================================================== */

const CHAMPION_ACCENTS = [
  '#0BC6E3', // cyan
  '#E0433E', // red
  '#C8AA6E', // gold
  '#9B6BFF', // violet
  '#3FBD8C', // emerald
  '#E0439E', // magenta
];

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const CHAMPION_NAMES = [
  ['Rek\'Sai', 'Void Burrower'],
  ['Irelia', 'Blade Dancer'],
  ['Azir', 'Emperor of the Sands'],
  ['Akali', 'Rogue Assassin'],
  ['Rengar', 'Pridestalker'],
  ['Ornn', 'Fire Below the Mountain'],
  ['Fiora', 'Grand Duelist'],
  ['Diana', 'Scorn of the Moon'],
  ['Nasus', 'Curator of the Sands'],
  ['Master Yi', 'Wuju Bladesman'],
  ['Kennen', 'Heart of the Tempest'],
  ['Jayce', 'Defender of Tomorrow'],
  ['Ambessa', 'Matriarch of War'],
  ['Mel', 'Soul\'s Reflection'],
  ['Jhin', 'Virtuoso'],
  ['Ahri', 'Nine-Tailed Fox'],
  ['Master Yi', 'Wuju Master'],
  ['Teemo', 'Swift Scout'],
  ['Kai\'Sa', 'Daughter of the Void'],
  ['Lux', 'Lady of Luminosity'],
  ['Lillia', 'Bashful Bloom'],
  ['Pyke', 'Bloodharbor Ripper'],
  ['Draven', 'Glorious Executioner'],
  ['Sett', 'The Boss'],
  ['Vex', 'Gloomist'],
  ['Darius', 'Hand of Noxus'],
  ['Kha\'Zix', 'Voidreaver'],
  ['Viktor', 'Herald of the Arcane'],
  ['Ezreal', 'Prodigal Explorer'],
  ['LeBlanc', 'Deceiver'],
  ['Annie', 'Dark Child'],
  ['Sivir', 'Battle Mistress'],
  ['Leona', 'Radiant Dawn'],
  ['Jinx', 'Loose Cannon'],
  ['Volibear', 'Relentless Storm'],
  ['Lee Sin', 'Blind Monk'],
  ['Yasuo', 'Unforgiven'],
  ['Garen', 'Might of Demacia'],
  ['Miss Fortune', 'Bounty Hunter'],
  ['Lucian', 'Purifier'],
  ['Vi', 'Destructive'],
];

const CHAMPIONS = CHAMPION_NAMES.map(([name, title], i) => {
  const baseSlug = slugify(name);
  const dupeCount = CHAMPION_NAMES.slice(0, i).filter(([n]) => n === name).length;
  const id = dupeCount > 0 ? `${baseSlug}-${slugify(title)}` : baseSlug;
  return {
    id,
    name,
    title,
    display: `${name}, ${title}`,
    accent: CHAMPION_ACCENTS[i % CHAMPION_ACCENTS.length],
    art: `assets/champions/${id}.jpg`,
  };
});

function findChampion(id) {
  return CHAMPIONS.find(c => c.id === id) || null;
}
