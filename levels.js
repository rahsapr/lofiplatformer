// =======================================================
//   LEVEL DATA - The single source of truth for all maps.
// =======================================================
// TILE KEY:
// P = Platform           B = Pushable Block      J = Jump Pad
// H = Hazard (spikes)    D = Diamond (collectible)
// S = Start              E = End
// T = Tree Trunk         L = Tree Leaves (Top)
// C = Cloud

const TILE_SIZE = 40;

const LEVEL_1_MAP = [
    "   C                                                        ",
    "                                                            ",
    "                                  C                           ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                         E  ",
    "                                                      PPPPPP",
    "                                    P                         ",
    "                                   P D                        ",
    "                        PP        P   P                       ",
    "                       P H P      PPPP                        ",
    "                      P  H  P                                 ",
    " T                    PPPPPPP        P    H H H    P          ",
    " L                       D           PPPPPPPPP                ",
    "           P                         T                        ",
    " T        P P                        L                        ",
    " L  S      P   P        P H P                                 ",
    " PPPPP   PPPPPP       PPPPPPP            PPPP                  ",
    " P   P                                HHH            T        ",
    " P   P   PPPP                                        L        ",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
];

const LEVEL_2_MAP = LEVEL_1_MAP.map(row => {
    return row.split('').reverse().join('').replace('S','_TEMP_').replace('E','S').replace('_TEMP_','E');
});

const LEVEL_3_MAP = [
    "                                                           E",
    "                                                        PPPP",
    "               C                                            ",
    "                                             P H P          ",
    "                                           PPPPPPP          ",
    "                                  P H P                     ",
    "                                PPPPPPP                     ",
    "                       P H P                                ",
    "                     PPPPPPP                                ",
    "                                                            ",
    "                    P                                       ",
    "   T               P                                        ",
    "   L        H H H P                                         ",
    "           PPPPPP P                                         ",
    "                  P                                         ",
    "   S             P                                          ",
    "PPPPPPPPPPPPPPPPPP                                          ",
    "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
];

const LEVEL_4_MAP = [
    "                                  C                         ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                        B  D   P    P                    E   ",
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

const LEVEL_5_MAP = [
    "                                  C                         ",
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

const LEVEL_7_MAP = [
    "                                                            ",
    "                                                            ",
    "                     P      E      P                        ",
    "                     P PPPPPPPPPP P                        ",
    "                     P P          P                        ",
    "                     P P B D      P                        ",
    "                     P PPPPPPPPPPPP                        ",
    "                     P                                     ",
    "                     P                                     ",
    " S                   P                                     ",
    "PPPPPPPPPPPPPPPPPPPPPP                                     ",
];

const LEVEL_8_MAP = [
    "                                                            ",
    "                                                            ",
    "                                C                           ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                         D                                  ",
    "                                                            ",
    " S                                                E         ",
    "PPPPPPPPP                    PPPPPPPPP                      ",
    "                                                            ",
];

const LEVEL_9_MAP = [
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                       B      D          E  ",
    "                                    PPPPPP        PPPPPPPPPP",
    "                                                            ",
    "                                                            ",
    " S                                                          ",
    "PPPPPPP                                                     ",
    "                                                            ",
];

const LEVEL_10_MAP = [
    "                             C                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                J                           ",
    "                          PPPPPPPPP                      E  ",
    "                         P         P                  PPPPPP",
    "                         P H H H H P                        ",
    "                         P    D    P                        ",
    "                 B       P         P                        ",
    " S        PPPPPPPPPPPPPPPP         PPPPPP                   ",
    "PPPPPP                                                      ",
    "                                                            ",
];

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