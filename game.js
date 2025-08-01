// --- Setup and DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const congratsScreen = document.getElementById('congratsScreen'); // NEW
const gameUI = document.getElementById('gameUI');

const startButton = document.getElementById('startButton');
const leaderboardButton = document.getElementById('leaderboardButton');
const backButton = document.getElementById('backButton');
const submitScoreButton = document.getElementById('submitScoreButton');
const replayButton = document.getElementById('replayButton'); // NEW
const homeButton = document.getElementById('homeButton');     // NEW
const nameInput = document.getElementById('nameInput');

const bestTimeEl = document.getElementById('bestTime');
const finalTimeEl = document.getElementById('finalTime');
const leaderboardListEl = document.getElementById('leaderboardList');
const timerEl = document.getElementById('timer');
const sprintStatusEl = document.getElementById('sprintStatus');


// --- Constants and Settings ---
const WIDTH = 1024;
const HEIGHT = 768;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Colors
const C_SKY_BLUE = '#87ceeb';
const C_PLAYER = '#ff7847'; // Coral
const C_PLATFORM_GRASS = '#32cd32';
const C_PLATFORM_DIRT = '#8b4513';
const C_HAZARD = '#ff0000';
const C_GOAL = '#ffd700'; // Gold

// Player Physics
const PLAYER_ACC = 0.6;
const PLAYER_SPRINT_ACC = 1.2;
const PLAYER_FRICTION = -0.12;
const PLAYER_GRAVITY = 0.8;
const PLAYER_JUMP_STRENGTH = -18;
const PLAYER_SPRINT_JUMP_STRENGTH = -22;
const PLAYER_SPRINT_DURATION = 250; // ms
const PLAYER_SPRINT_COOLDOWN = 1000; // ms

// Level Data
const TILE_SIZE = 40;
// CHANGED: The final platform is now 2 tiles lower to make it easier to reach.
const LEVEL_MAP = [
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

const LEVEL_WIDTH = LEVEL_MAP[0].length * TILE_SIZE;
const LEVEL_HEIGHT = LEVEL_MAP.length * TILE_SIZE;

// --- Game State and Classes ---
let keys = {};
let player, platforms, hazards, goal;
let camera = { x: 0, y: 0 };
let startTime, finalTime;
let animationFrameId;
let gameState = 'START'; // START, PLAYING, END, CONGRATS

// Helper function for AABB collision detection
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

class Player {
    constructor(x, y) {
        this.width = TILE_SIZE - 8;
        this.height = TILE_SIZE * 1.5;
        this.pos = { x, y };
        this.vel = { x: 0, y: 0 };
        this.jumpsLeft = 2;
        this.onGround = false;

        this.isSprinting = false;
        this.sprintTimer = 0;
        this.sprintCooldownTimer = 0;
    }

    jump() {
        if (this.jumpsLeft > 0) {
            if (this.onGround && this.isSprinting) {
                this.vel.y = PLAYER_SPRINT_JUMP_STRENGTH;
            } else {
                this.vel.y = PLAYER_JUMP_STRENGTH;
            }
            this.jumpsLeft--;
            this.onGround = false;
        }
    }

    sprint() {
        if (this.onGround && performance.now() > this.sprintCooldownTimer) {
            this.isSprinting = true;
            this.sprintTimer = performance.now();
        }
    }

    respawn(startPos) {
        this.pos.x = startPos.x;
        this.pos.y = startPos.y;
        this.vel = { x: 0, y: 0 };
        this.onGround = false;
        this.isSprinting = false;
    }

    update(platforms) {
        let accX = 0;
        const moveForce = (this.isSprinting && this.onGround) ? PLAYER_SPRINT_ACC : PLAYER_ACC;
        if (keys['a'] || keys['ArrowLeft']) accX = -moveForce;
        if (keys['d'] || keys['ArrowRight']) accX = moveForce;
        if (this.isSprinting && performance.now() - this.sprintTimer > PLAYER_SPRINT_DURATION) {
            this.isSprinting = false;
            this.sprintCooldownTimer = performance.now() + PLAYER_SPRINT_COOLDOWN;
        }

        if (accX === 0) {
            accX += this.vel.x * PLAYER_FRICTION;
        }
        this.vel.x += accX;
        this.vel.y += PLAYER_GRAVITY;
        
        if (this.vel.y > TILE_SIZE) this.vel.y = TILE_SIZE;
        const maxSpeed = (this.isSprinting && this.onGround) ? 12 : 7;
        if (Math.abs(this.vel.x) > maxSpeed) {
            this.vel.x = Math.sign(this.vel.x) * maxSpeed;
        }

        const playerRect = { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height };

        playerRect.y += this.vel.y;
        this.onGround = false;

        for (const p of platforms) {
            if (isColliding(playerRect, p)) {
                if (this.vel.y > 0) {
                    playerRect.y = p.y - this.height;
                    this.vel.y = 0;
                    this.onGround = true;
                    this.jumpsLeft = 2;
                } else if (this.vel.y < 0) {
                    playerRect.y = p.y + p.height;
                    this.vel.y = 0;
                }
            }
        }
        this.pos.y = playerRect.y;

        playerRect.x += this.vel.x;
        for (const p of platforms) {
            if (isColliding(playerRect, p)) {
                if (this.vel.x > 0) {
                    playerRect.x = p.x - this.width;
                } else if (this.vel.x < 0) {
                    playerRect.x = p.x + p.width;
                }
                this.vel.x = 0;
            }
        }
        this.pos.x = playerRect.x;
    }

    draw(ctx) {
        ctx.fillStyle = C_PLAYER;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
    }
}

class Platform {
    constructor(x, y) { this.x = x; this.y = y; this.width = TILE_SIZE; this.height = TILE_SIZE; }
    draw(ctx) {
        const grassHeight = 8;
        ctx.fillStyle = C_PLATFORM_GRASS;
        ctx.fillRect(this.x, this.y, this.width, grassHeight);
        ctx.fillStyle = C_PLATFORM_DIRT;
        ctx.fillRect(this.x, this.y + grassHeight, this.width, this.height - grassHeight);
    }
}

class Hazard {
    constructor(x,y) { this.x = x; this.y = y + TILE_SIZE / 2; this.width = TILE_SIZE; this.height = TILE_SIZE / 2; }
    draw(ctx) { ctx.fillStyle = C_HAZARD; ctx.fillRect(this.x, this.y, this.width, this.height); }
}

class Goal {
    constructor(x,y) { this.x = x; this.y = y; this.width = TILE_SIZE; this.height = TILE_SIZE; }
    draw(ctx) { ctx.fillStyle = C_GOAL; ctx.fillRect(this.x, this.y, this.width, this.height); }
}

// --- Game Logic ---
let gameStartPos = { x: 0, y: 0 };

function initLevel() {
    platforms = []; hazards = [];
    let foundStart = false;
    LEVEL_MAP.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const tile = row[colIndex];
            const x = colIndex * TILE_SIZE;
            const y = rowIndex * TILE_SIZE;
            if (tile === 'P') {
                platforms.push(new Platform(x, y));
                if (LEVEL_MAP[rowIndex-1] && LEVEL_MAP[rowIndex-1][colIndex] === 'S' && !foundStart) {
                     gameStartPos = { x: x + (TILE_SIZE / 2) - ((TILE_SIZE-8)/2), y: y - (TILE_SIZE * 1.5) };
                     foundStart = true;
                }
            }
            else if (tile === 'H') hazards.push(new Hazard(x, y));
            else if (tile === 'E') goal = new Goal(x, y);
        }
    });
    player = new Player(gameStartPos.x, gameStartPos.y);
}

function checkOtherCollisions() {
    const playerRect = { x: player.pos.x, y: player.pos.y, width: player.width, height: player.height };
    for(const h of hazards) { if (isColliding(playerRect, h)) { player.respawn(gameStartPos); return; } }
    if (goal && isColliding(playerRect, goal)) { endGame(); return; }
    if (player.pos.y > LEVEL_HEIGHT + 200) { player.respawn(gameStartPos); }
}

function update() {
    player.update(platforms);
    checkOtherCollisions();
    const targetCamX = player.pos.x + player.width / 2 - WIDTH / 2;
    const targetCamY = player.pos.y + player.height / 2 - HEIGHT / 2;
    camera.x += (targetCamX - camera.x) * 0.08;
    camera.y += (targetCamY - camera.y) * 0.08;
    if (camera.x < 0) camera.x = 0;
    if (camera.x > LEVEL_WIDTH - WIDTH) camera.x = LEVEL_WIDTH - WIDTH;
    if (camera.y < 0) camera.y = 0;
    if (camera.y > LEVEL_HEIGHT - HEIGHT) camera.y = LEVEL_HEIGHT - HEIGHT;
    const elapsedTime = (performance.now() - startTime) / 1000;
    timerEl.textContent = `Time: ${elapsedTime.toFixed(2)}`;
    if (player.isSprinting) { sprintStatusEl.textContent = 'SPRINT!'; sprintStatusEl.style.color = C_PLAYER;
    } else if (performance.now() < player.sprintCooldownTimer) { sprintStatusEl.textContent = 'Cooldown'; sprintStatusEl.style.color = 'black';
    } else { sprintStatusEl.textContent = 'Sprint Ready'; sprintStatusEl.style.color = 'green'; }
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    platforms.forEach(p => p.draw(ctx));
    hazards.forEach(h => h.draw(ctx));
    if (goal) goal.draw(ctx);
    player.draw(ctx);
    ctx.restore();
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;
    update(); draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Game State Management ---
function startGame() {
    gameState = 'PLAYING';
    startScreen.style.display = 'none';
    endScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    congratsScreen.style.display = 'none'; // NEW: Hide congrats screen
    gameUI.style.display = 'flex';
    initLevel();
    startTime = performance.now();
    gameLoop();
}

function endGame() {
    if (gameState !== 'PLAYING') return;
    gameState = 'END';
    cancelAnimationFrame(animationFrameId);
    finalTime = (performance.now() - startTime) / 1000;
    gameUI.style.display = 'none';
    endScreen.style.display = 'flex';
    finalTimeEl.textContent = `Your Time: ${finalTime.toFixed(2)}s`;
    nameInput.focus();
}

// NEW: Function to show the congrats screen
function showCongratsScreen() {
    gameState = 'CONGRATS';
    startScreen.style.display = 'none';
    endScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    gameUI.style.display = 'none';
    congratsScreen.style.display = 'flex';
}

function showStartScreen() {
    gameState = 'START';
    startScreen.style.display = 'flex';
    endScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    congratsScreen.style.display = 'none'; // NEW: Hide congrats screen
    gameUI.style.display = 'none';
    const leaderboard = loadLeaderboard();
    bestTimeEl.textContent = (leaderboard.length > 0)
        ? `Best Time: ${leaderboard[0].score.toFixed(2)}s`
        : 'Be the first to set a time!';
}

function showLeaderboard() {
    startScreen.style.display = 'none';
    leaderboardScreen.style.display = 'flex';
    const leaderboard = loadLeaderboard();
    leaderboardListEl.innerHTML = '';
    if (leaderboard.length === 0) {
        leaderboardListEl.innerHTML = '<div>No scores yet!</div>';
    } else {
        leaderboard.forEach((entry, index) => {
            const div = document.createElement('div');
            div.textContent = `${index + 1}. ${entry.name} - ${entry.score.toFixed(2)}s`;
            leaderboardListEl.appendChild(div);
        });
    }
}

// --- Leaderboard ---
function loadLeaderboard() {
    const data = localStorage.getItem('flowyJumperLeaderboard');
    return data ? JSON.parse(data) : [];
}

function saveLeaderboard(name, score) {
    if (!name) name = 'Anonymous';
    const leaderboard = loadLeaderboard();
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => a.score - b.score);
    localStorage.setItem('flowyJumperLeaderboard', JSON.stringify(leaderboard.slice(0, 10)));
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (gameState === 'PLAYING') {
        if (e.key === ' ' || e.key === 'w' || e.key === 'ArrowUp') { e.preventDefault(); player.jump(); }
        if (e.key === 'Shift') player.sprint();
        if (e.key === 'r' || e.key === 'R') startGame();
    }
    if (gameState === 'END' && e.key === 'Enter') submitScoreButton.click();
});

window.addEventListener('keyup', (e) => { keys[e.key] = false; });
startButton.addEventListener('click', startGame);
leaderboardButton.addEventListener('click', showLeaderboard);
backButton.addEventListener('click', showStartScreen);

// CHANGED: The submit button now takes you to the congrats screen.
submitScoreButton.addEventListener('click', () => {
    saveLeaderboard(nameInput.value, finalTime);
    nameInput.value = '';
    showCongratsScreen(); // Go to congrats screen instead of home.
});

// NEW: Event listeners for the new buttons.
replayButton.addEventListener('click', startGame);
homeButton.addEventListener('click', showStartScreen);

// --- Initial Call ---
showStartScreen();
