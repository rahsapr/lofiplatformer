// =======================================================
//   LEVEL DATA - The single source of truth for all maps.
// =======================================================
// To add a new level, simply:
// 1. Create a new const variable (e.g., LEVEL_11_MAP).
// 2. Design your level using the character codes.
// 3. Add the new variable to the LEVEL_MAPS array at the bottom.

const TILE_SIZE = 40;

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

// --- Level 3: The Ascent ---
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
    "                    P                                       ",
    "                   P                                        ",
    "            H H H P                                         ",
    "           PPPPPP P                                         ",
    "                  P                                         ",
    "   S             P                                          ",
    "PPPPPPPPPPPPPPPPPP                                          ",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
];

// --- Level 4: Push Tutorial ---
const LEVEL_4_MAP = [
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                        B      P    P                    E   ",
    " S      P             PPPP   PPPPPP   PPPPPPPPPPPPPPPPPPPPPPPP",
    " PPPPPPPP                                                     ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
];

// --- Level 5: Stairway to Heaven ---
const LEVEL_5_MAP = [
    "                                                            ",
    "                                                            ",
    "                                                         E  ",
    "                                                      PPPPPP",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                       B                    ",
    "                                    PPPPPP                  ",
    "                                                            ",
    "                             B                              ",
    "                          PPPPPP                            ",
    "                                                            ",
    "                   B                                        ",
    " S              PPPPPP                                      ",
    " PPPPPPPPPPP                                                  ",
    "                                                            ",
    "                                                            ",
];

// --- Level 6: "The Wall" ---
const LEVEL_6_MAP = [
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                               PPPPPPPPP                    ",
    "                               P                            ",
    "                               P                            ",
    "                               P H H H H H H H H H H H H H E",
    "                               PPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
    "  S      B                     P                            ",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP                            ",
];

// --- Level 7: Squeeze Puzzle ---
const LEVEL_7_MAP = [
    "                                                            ",
    "                                                            ",
    "                     P      E      P                        ",
    "                     P PPPPPPPPPP P                        ",
    "                     P P          P                        ",
    "                     P P B        P                        ",
    "                     P PPPPPPPPPPPP                        ",
    "                     P                                     ",
    "                     P                                     ",
    " S                   P                                     ",
    "PPPPPPPPPPPPPPPPPPPPPP                                     ",
];

// --- Level 8: "The Dash Gap" ---
const LEVEL_8_MAP = [
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    " S                                                E         ",
    "PPPPPPPPP                    PPPPPPPPP                      ",
    "                                                            ",
];

// --- Level 9: Block and Dash ---
const LEVEL_9_MAP = [
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                       B                 E  ",
    "                                    PPPPPP        PPPPPPPPPP",
    "                                                            ",
    "                                                            ",
    " S                                                          ",
    "PPPPPPP                                                     ",
    "                                                            ",
];

// --- Level 10: The Gauntlet ---
const LEVEL_10_MAP = [
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                          PPPPPPPPP                      E  ",
    "                         P         P                  PPPPPP",
    "                         P H H H H P                        ",
    "                         P         P                        ",
    "                 B       P         P                        ",
    " S        PPPPPPPPPPPPPPPP         PPPPPP                   ",
    "PPPPPP                                                      ",
    "                                                            ",
];

// The main array that the game will use.
const LEVEL_MAPS = [
    LEVEL_1_MAP,
    LEVEL_2_MAP,
    LEVEL_3_MAP,
    LEVEL_4_MAP,
    LEVEL_5_MAP,
    LEVEL_6_MAP,
    LEVEL_7_MAP,
    LEVEL_8_MAP,
    LEVEL_9_MAP,
    LEVEL_10_MAP,
];