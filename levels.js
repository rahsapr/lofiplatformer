// =======================================================
//   LEVEL DATA - The single source of truth for all maps.
// =======================================================
// To add a new level, simply:
// 1. Create a new const variable (e.g., LEVEL_4_MAP).
// 2. Design your level using the character codes.
// 3. Add the new variable to the LEVEL_MAPS array at the bottom.

const TILE_SIZE = 40; // This can stay here as it's a core level property.

// --- Level 1: The Original ---
const LEVEL_1_MAP = [
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                         E  ",
    "                                                      PPPPPP",
    "                                    P                         ",
    "                                   P P                        ",
    "                        PP        P   P                       ",
    "                       P H P      PPPP                        ",
    "                      P  H  P                                 ",
    "                      PPPPPPP        P    H H H    P          ",
    "                                     PPPPPPPPP                ",
    "           P                                                  ",
    "          P P                                                 ",
    "  S      P   P        P H P                                   ",
    " PPPPP   PPPPPP       PPPPPPP            PPPP                  ",
    " P   P                                HHH                     ",
    " P   P   PPPP                                                 ",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
];

// --- Level 2: The Reverse ---
const LEVEL_2_MAP = LEVEL_1_MAP.map(row => {
    return row.split('').reverse().join('')
              .replace('S', '_TEMP_').replace('E', 'S').replace('_TEMP_', 'E');
});

// --- Level 3: A New, Unique Challenge "The Ascent" ---
const LEVEL_3_MAP = [
    "                                                           E",
    "                                                        PPPP",
    "                                                            ",
    "                                             P H P          ",
    "                                           PPPPPPP          ",
    "                                  P H P                     ",
    "                                PPPPPPP                     ",
    "                       P H P                                ",
    "                     PPPPPPP                                ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "            H H H P                                         ",
    "           PPPPPP P                                         ",
    "                  P                                         ",
    "   S             P                                          ",
    "PPPPPPPPPPPPPPPPPP                                          ",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
];


// The main array that the game will use.
// This is the ONLY place you need to update when adding a new level map.
const LEVEL_MAPS = [
    LEVEL_1_MAP,
    LEVEL_2_MAP,
    LEVEL_3_MAP
];
