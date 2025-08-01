// --- Setup and DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const gameUI = document.getElementById('gameUI');

const startButton = document.getElementById('startButton');
const leaderboardButton = document.getElementById('leaderboardButton');
const backButton = document.getElementById('backButton');
const submitScoreButton = document.getElementById('submitScoreButton');
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
const PLAYER_FRICTION = -0.12;
const PLAYER_GRAVITY = 0.8;
const PLAYER_JUMP_STRENGTH = -18;
const PLAYER_SPRINT_SPEED = 8;
const PLAYER_SPRINT_DURATION = 250; // ms
const PLAYER_SPRINT_COOLDOWN = 1000; // ms

// Level Data
const TILE_SIZE = 40;
const LEVEL_MAP = [
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                         E  ",
    "                                                      PPPPPP",
    "                                                            ",
    "                                                            ",
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
let gameState = 'START'; // START, PLAYING, END

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
        this.pos = { x, y }; // Note: pos.y is now the TOP of the player
        this.vel = { x: 0, y: 0 };
        this.jumpsLeft = 2;
        this.onGround = false;

        this.isSprinting = false;
        this.sprintTimer = 0;
        this.sprintCooldownTimer = 0;
    }

    jump() {
        if (this.jumpsLeft > 0) {
            this.vel.y = PLAYER_JUMP_STRENGTH;
            this.jumpsLeft--;
            this.onGround = false;
        }
    }

    sprint() {
        if (performance.now() > this.sprintCooldownTimer) {
            this.isSprinting = true;
            this.sprintTimer = performance.now();
        }
    }

    respawn(startPos) {
        this.pos.x = startPos.x;
        this.pos.y = startPos.y;
        this.vel = { x: 0, y: 0 };
        this.onGround = false;
    }

    update(platforms) {
        // --- 1. Calculate Acceleration & Sprinting ---
        let accX = 0;
        const moveSpeed = this.isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_ACC;

        if (keys['a'] || keys['ArrowLeft']) accX = -moveSpeed;
        if (keys['d'] || keys['ArrowRight']) accX = moveSpeed;

        if (this.isSprinting && performance.now() - this.sprintTimer > PLAYER_SPRINT_DURATION) {
            this.isSprinting = false;
            this.sprintCooldownTimer = performance.now() + PLAYER_SPRINT_COOLDOWN;
        }

        // --- 2. Compute Velocity (Physics) ---
        if (!this.isSprinting) {
            accX += this.vel.x * PLAYER_FRICTION;
        }
        this.vel.x += accX;
        this.vel.y += PLAYER_GRAVITY;
        
        // Limit max fall speed to prevent extreme tunneling
        if (this.vel.y > TILE_SIZE) {
            this.vel.y = TILE_SIZE;
        }

        // --- 3. Handle Collisions (The Robust Way) ---
        // Create a representation of the player for collision checks
        const playerRect = { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height };

        // ** Y-AXIS COLLISION **
        playerRect.y += this.vel.y;
        this.onGround = false; // Assume not on ground until a collision proves otherwise

        for (const p of platforms) {
            if (isColliding(playerRect, p)) {
                if (this.vel.y > 0) { // Moving Down (Landing)
                    playerRect.y = p.y - this.height; // Snap top of player to just above platform
                    this.vel.y = 0;
                    this.onGround = true;
                    this.jumpsLeft = 2; // Reset jumps on landing
                } else if (this.vel.y < 0) { // Moving Up (Hitting Ceiling)
                    playerRect.y = p.y + p.height; // Snap top of player to just below platform
                    this.vel.y = 0;
                }
            }
        }
        this.pos.y = playerRect.y; // Commit the final Y position

        // ** X-AXIS COLLISION **
        playerRect.x += this.vel.x;
        for (const p of platforms) {
            if (isColliding(playerRect, p)) {
                if (this.vel.x > 0) { // Moving Right
                    playerRect.x = p.x - this.width;
                } else if (this.vel.x < 0) { // Moving Left
                    playerRect.x = p.x + p.width;
                }
                this.vel.x = 0; // Stop horizontal movement on wall collision
            }
        }
        this.pos.x = playerRect.x; // Commit the final X position
    }

    draw(ctx, camera) {
        ctx.fillStyle = C_PLAYER;
        ctx.fillRect(this.pos.x - camera.x, this.pos.y - camera.y, this.width, this.height);
    }
}

class Platform {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
    }
    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;
        const grassHeight = 8;
        ctx.fillStyle = C_PLATFORM_GRASS;
        ctx.fillRect(drawX, drawY, this.width, grassHeight);
        ctx.fillStyle = C_PLATFORM_DIRT;
        ctx.fillRect(drawX, drawY + grassHeight, this.width, this.height - grassHeight);
    }
}

class Hazard {
    constructor(x,y) {
        this.x = x;
        this.y = y + TILE_SIZE / 2;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE / 2;
    }
    draw(ctx, camera) {
        ctx.fillStyle = C_HAZARD;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
    }
}

class Goal {
     constructor(x,y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
    }
    draw(ctx, camera) {
        ctx.fillStyle = C_GOAL;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
    }
}

// --- Game Logic ---
let gameStartPos = { x: 0, y: 0 };

function initLevel() {
    platforms = [];
    hazards = [];
    let foundStart = false;
    
    LEVEL_MAP.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const tile = row[colIndex];
            const x = colIndex * TILE_SIZE;
            const y = rowIndex * TILE_SIZE;

            if (tile === 'P') {
                platforms.push(new Platform(x, y));
                // ** GUARANTEED START **: Find the first platform in the 'S' row and set it as the start.
                if (LEVEL_MAP[rowIndex-1][colIndex] === 'S' && !foundStart) {
                     gameStartPos = {
                         x: x + (TILE_SIZE / 2) - ((TILE_SIZE-8)/2), // Center the player on the tile
                         y: y - (TILE_SIZE * 1.5) // Place player top so its bottom is on the platform
                     };
                     foundStart = true;
                }
            }
            else if (tile === 'H') hazards.push(new Hazard(x, y));
            else if (tile === 'E') goal = new Goal(x, y);
        }
    });
    
    // Create the player AFTER finding the start position.
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

    // Update Camera
    const targetCamX = player.pos.x + player.width / 2 - WIDTH / 2;
    const targetCamY = player.pos.y + player.height / 2 - HEIGHT / 2;
    camera.x += (targetCamX - camera.x) * 0.08;
    camera.y += (targetCamY - camera.y) * 0.08;

    // Clamp camera
    if (camera.x < 0) camera.x = 0;
    if (camera.x > LEVEL_WIDTH - WIDTH) camera.x = LEVEL_WIDTH - WIDTH;
    if (camera.y < 0) camera.y = 0;
    if (camera.y > LEVEL_HEIGHT - HEIGHT) camera.y = LEVEL_HEIGHT - HEIGHT;
    
    // Update UI
    const elapsedTime = (performance.now() - startTime) / 1000;
    timerEl.textContent = `Time: ${elapsedTime.toFixed(2)}`;

    if (player.isSprinting) {
        sprintStatusEl.textContent = 'SPRINT!';
        sprintStatusEl.style.color = C_PLAYER;
    } else if (performance.now() < player.sprintCooldownTimer) {
        sprintStatusEl.textContent = 'Cooldown';
        sprintStatusEl.style.color = 'black';
    } else {
        sprintStatusEl.textContent = 'Sprint Ready';
        sprintStatusEl.style.color = 'green';
    }
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    platforms.forEach(p => p.draw(ctx, camera));
    hazards.forEach(h => h.draw(ctx, camera));
    if (goal) goal.draw(ctx, camera);
    player.draw(ctx, camera);

    ctx.restore();
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Game State Management ---
function startGame() {
    gameState = 'PLAYING';
    startScreen.style.display = 'none';
    endScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
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

function showStartScreen() {
    gameState = 'START';
    startScreen.style.display = 'flex';
    endScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
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
        if (e.key === ' ' || e.key === 'w' || e.key === 'ArrowUp') {
            e.preventDefault(); player.jump();
        }
        if (e.key === 'Shift') player.sprint();
        if (e.key === 'r' || e.key === 'R') startGame();
    }
    if (gameState === 'END' && e.key === 'Enter') submitScoreButton.click();
});

window.addEventListener('keyup', (e) => { keys[e.key] = false; });
startButton.addEventListener('click', startGame);
leaderboardButton.addEventListener('click', showLeaderboard);
backButton.addEventListener('click', showStartScreen);
submitScoreButton.addEventListener('click', () => {
    saveLeaderboard(nameInput.value, finalTime);
    nameInput.value = '';
    showStartScreen();
});

// --- Initial Call ---
showStartScreen();
