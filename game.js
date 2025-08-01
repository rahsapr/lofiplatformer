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
    " PPPPP   PPPPPP       PPPPPPP            PPPP                  ", // Added one more 'P' here to make start platform more solid
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

class Player {
    constructor(x, y) {
        this.width = TILE_SIZE - 8;
        this.height = TILE_SIZE * 1.5;
        // Physics vectors (using simple objects)
        this.pos = { x: x, y: y }; // this.pos.y represents the bottom of the player's rectangle
        this.vel = { x: 0, y: 0 };
        this.acc = { x: 0, y: 0 };
        // State
        this.jumpsLeft = 2;
        this.isSprinting = false;
        this.sprintTimer = 0;
        this.sprintCooldownTimer = 0;
    }

    jump() {
        if (this.jumpsLeft > 0) {
            this.vel.y = PLAYER_JUMP_STRENGTH;
            this.jumpsLeft--;
        }
    }

    sprint() {
        if (performance.now() > this.sprintCooldownTimer) {
            this.isSprinting = true;
            this.sprintTimer = performance.now();
        }
    }

    land() {
        this.jumpsLeft = 2;
    }

    respawn(startPos) {
        this.pos.x = startPos.x;
        this.pos.y = startPos.y;
        this.vel = { x: 0, y: 0 };
        this.acc = { x: 0, y: 0 };
    }

    update() {
        this.acc = { x: 0, y: PLAYER_GRAVITY };

        const moveSpeed = this.isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_ACC;
        if (keys['a'] || keys['ArrowLeft']) this.acc.x = -moveSpeed;
        if (keys['d'] || keys['ArrowRight']) this.acc.x = moveSpeed;

        if (this.isSprinting && performance.now() - this.sprintTimer > PLAYER_SPRINT_DURATION) {
            this.isSprinting = false;
            this.sprintCooldownTimer = performance.now() + PLAYER_SPRINT_COOLDOWN;
        }

        if (!this.isSprinting) {
             this.acc.x += this.vel.x * PLAYER_FRICTION;
        }

        // Apply acceleration to velocity
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;

        // Apply velocity to position
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y; // <--- CHANGED: Removed the 0.5 * this.acc.y part
    }

    draw(ctx, camera) {
        ctx.fillStyle = C_PLAYER;
        // Draw using pos.x as center, pos.y as bottom
        ctx.fillRect(this.pos.x - this.width / 2 - camera.x, this.pos.y - this.height - camera.y, this.width, this.height);
    }
}

class Platform {
    constructor(x, y, w, h, type = 'platform') {
        this.x = x;
        this.y = y; // y represents the top of the platform
        this.width = w;
        this.height = h;
        this.type = type;
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        if (this.type === 'hazard') {
            ctx.fillStyle = C_HAZARD;
            ctx.fillRect(drawX, drawY, this.width, this.height);
        } else if (this.type === 'goal') {
            ctx.fillStyle = C_GOAL;
            ctx.fillRect(drawX, drawY, this.width, this.height);
        } else {
            const grassHeight = 8;
            ctx.fillStyle = C_PLATFORM_GRASS;
            ctx.fillRect(drawX, drawY, this.width, grassHeight);
            ctx.fillStyle = C_PLATFORM_DIRT;
            ctx.fillRect(drawX, drawY + grassHeight, this.width, this.height - grassHeight);
        }
    }
}


// --- Game Logic ---
let gameStartPos = { x: 0, y: 0 }; // Global variable to store the actual start position for respawns

function initLevel() {
    platforms = [];
    hazards = [];
    
    LEVEL_MAP.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const tile = row[colIndex];
            const x = colIndex * TILE_SIZE;
            const y = rowIndex * TILE_SIZE;

            if (tile === 'P') platforms.push(new Platform(x, y, TILE_SIZE, TILE_SIZE));
            else if (tile === 'H') hazards.push(new Platform(x, y + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE / 2, 'hazard'));
            else if (tile === 'E') goal = new Platform(x, y, TILE_SIZE, TILE_SIZE, 'goal');
            else if (tile === 'S') {
                // Player's pos.y is its bottom. So, to place player on top of platform:
                // Platform top (y) + TILE_SIZE (platform height) - 1 (1 pixel above platform top)
                gameStartPos = { x: x + TILE_SIZE / 2, y: y + TILE_SIZE - 1 }; 
            }
        }
    });

    player = new Player(gameStartPos.x, gameStartPos.y); // Initialize player at parsed start position
}


function checkCollisions() {
    // Create a rect for player for easier AABB collision checks
    let playerRect = { 
        x: player.pos.x - player.width / 2, 
        y: player.pos.y - player.height, 
        width: player.width, 
        height: player.height 
    };

    // Horizontal collision
    platforms.forEach(p => {
        if (playerRect.x < p.x + p.width && playerRect.x + playerRect.width > p.x &&
            playerRect.y < p.y + p.height && playerRect.y + playerRect.height > p.y) {
            
            if (player.vel.x > 0) { // Moving right
                player.pos.x = p.x - player.width / 2;
            } else if (player.vel.x < 0) { // Moving left
                player.pos.x = p.x + p.width + player.width / 2;
            }
            player.vel.x = 0;
        }
    });

    // Re-calculate playerRect after horizontal resolution to ensure accurate vertical checks
    playerRect = { 
        x: player.pos.x - player.width / 2, 
        y: player.pos.y - player.height, 
        width: player.width, 
        height: player.height 
    };

    // Vertical collision
    platforms.forEach(p => {
        if (playerRect.x < p.x + p.width && playerRect.x + playerRect.width > p.x &&
            playerRect.y < p.y + p.height && playerRect.y + playerRect.height > p.y) {
            
            // Landing on top: player moving down (vel.y > 0) AND the player's current bottom 
            // is less than where the platform's top would be if player had moved past it + a buffer.
            // This prevents falling through if a large velocity causes overshooting.
            if (player.vel.y > 0 && player.pos.y < p.y + player.vel.y + 1) { // <--- CHANGED: More robust landing condition
                player.pos.y = p.y; // Set player's bottom to platform's top
                player.vel.y = 0;
                player.land();
            } else if (player.vel.y < 0) { // Hitting from below (ceiling)
                player.pos.y = p.y + p.height + player.height; // Set player's bottom to bottom of platform + player height (i.e. top to bottom of platform)
                player.vel.y = 0;
            }
        }
    });

    // Hazard collision
    hazards.forEach(h => {
        if (playerRect.x < h.x + h.width && playerRect.x + playerRect.width > h.x &&
            playerRect.y < h.y + h.height && playerRect.y + h.height > h.y) { // Check collision with hazard
            player.respawn(gameStartPos); // Use the global gameStartPos
        }
    });

    // Goal collision
    if (goal && playerRect.x < goal.x + goal.width && playerRect.x + playerRect.width > goal.x &&
        playerRect.y < goal.y + goal.height && playerRect.y + playerRect.height > goal.y) {
        endGame();
    }
    
    // Fall off map
    if (player.pos.y > LEVEL_HEIGHT + 200) { // Check player's bottom against slightly below level bottom
        player.respawn(gameStartPos);
    }
}


function update() {
    player.update();
    checkCollisions();

    // Update Camera (lerp for smooth follow)
    const targetCamX = player.pos.x - WIDTH / 2;
    const targetCamY = player.pos.y - HEIGHT / 2;
    camera.x += (targetCamX - camera.x) * 0.08;
    camera.y += (targetCamY - camera.y) * 0.08;

    // Clamp camera to level boundaries
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
    ctx.clearRect(0, 0, WIDTH, HEIGHT); // Clear canvas

    // The camera effectively translates the world, so we draw everything offset by camera.x/y
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
    
    initLevel(); // Re-initialize level elements and player for a fresh start
    player.respawn(gameStartPos); // Ensure player is at the determined start position
    
    startTime = performance.now();
    gameLoop();
}

function endGame() {
    if (gameState !== 'PLAYING') return; // Prevent multiple triggers
    
    gameState = 'END';
    cancelAnimationFrame(animationFrameId);
    finalTime = (performance.now() - startTime) / 1000;
    
    gameUI.style.display = 'none';
    endScreen.style.display = 'flex';
    finalTimeEl.textContent = `Your Time: ${finalTime.toFixed(2)}s`;
    nameInput.focus(); // Auto-focus the input field
}

function showStartScreen() {
    gameState = 'START';
    startScreen.style.display = 'flex';
    endScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    gameUI.style.display = 'none';
    
    const leaderboard = loadLeaderboard();
    if (leaderboard.length > 0) {
        bestTimeEl.textContent = `Best Time: ${leaderboard[0].score.toFixed(2)}s`;
    } else {
        bestTimeEl.textContent = 'Be the first to set a time!';
    }
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
            e.preventDefault(); // Prevent page scrolling
            player.jump();
        }
        if (e.key === 'Shift') player.sprint();
        if (e.key === 'r' || e.key === 'R') startGame(); // Restart
    }
    
    if (gameState === 'END' && e.key === 'Enter') {
        submitScoreButton.click();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

startButton.addEventListener('click', startGame);
leaderboardButton.addEventListener('click', showLeaderboard);
backButton.addEventListener('click', showStartScreen);
submitScoreButton.addEventListener('click', () => {
    saveLeaderboard(nameInput.value, finalTime);
    nameInput.value = '';
    showStartScreen();
});

// --- Initial Call ---
initLevel(); // Call once initially to parse start position
showStartScreen();
