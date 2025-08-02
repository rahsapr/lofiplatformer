// --- Setup and DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const intermissionScreen = document.getElementById('intermissionScreen');
const gameCompleteScreen = document.getElementById('gameCompleteScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const gameUI = document.getElementById('gameUI');
const startButton = document.getElementById('startButton');
const leaderboardButton = document.getElementById('leaderboardButton');
const backButton = document.getElementById('backButton');
const submitScoreButton = document.getElementById('submitScoreButton');
const replayButton = document.getElementById('replayButton');
const homeButton = document.getElementById('homeButton');
const nextLevelButton = document.getElementById('nextLevelButton');
const nameInput = document.getElementById('nameInput');
const bestTimeEl = document.getElementById('bestTime');
const finalTimeStat = document.getElementById('finalTimeStat');
const finalDeathsStat = document.getElementById('finalDeathsStat');
const leaderboardListEl = document.getElementById('leaderboardList');
const timerEl = document.getElementById('timer');
const deathsCounter = document.getElementById('deathsCounter');
const sprintStatusEl = document.getElementById('sprintStatus');
const levelStartBanner = document.getElementById('levelStartBanner');
const levelBannerText = document.getElementById('levelBannerText');
const musicVolumeSlider = document.getElementById('musicVolumeSlider');
const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
const masterMuteCheckbox = document.getElementById('masterMuteCheckbox');


// --- Audio Setup ---
const backgroundMusic = new Audio('assets/background.mp3');
backgroundMusic.loop = true;
const gameOverMusic = new Audio('assets/gameover.mp3');


// --- Settings Management ---
let gameSettings = { musicVolume: 0.5, sfxVolume: 0.5, isMuted: false };

function saveSettings() {
    localStorage.setItem('flowyJumperSettings', JSON.stringify(gameSettings));
}

function loadSettings() {
    const saved = localStorage.getItem('flowyJumperSettings');
    if (saved) { gameSettings = JSON.parse(saved); }
    musicVolumeSlider.value = gameSettings.musicVolume;
    sfxVolumeSlider.value = gameSettings.sfxVolume;
    masterMuteCheckbox.checked = gameSettings.isMuted;
    applyAudioSettings();
}

function applyAudioSettings() {
    backgroundMusic.volume = gameSettings.musicVolume;
    gameOverMusic.volume = gameSettings.musicVolume;
    backgroundMusic.muted = gameSettings.isMuted;
    gameOverMusic.muted = gameSettings.isMuted;
}


// --- Constants and Settings ---
const WIDTH = 1024, HEIGHT = 768;
canvas.width = WIDTH; canvas.height = HEIGHT;
const C_SKY_BLUE = '#87ceeb', C_PLAYER = '#ff7847', C_PLATFORM_GRASS = '#32cd32',
      C_PLATFORM_DIRT = '#8b4513', C_HAZARD = '#ff0000', C_GOAL = '#ffd700';
const PLAYER_ACC = 0.6, PLAYER_SPRINT_ACC = 1.2, PLAYER_FRICTION = -0.12,
      PLAYER_GRAVITY = 0.8, PLAYER_JUMP_STRENGTH = -18, PLAYER_SPRINT_JUMP_STRENGTH = -22,
      PLAYER_SPRINT_DURATION = 250, PLAYER_SPRINT_COOLDOWN = 1000;
const LEVEL_WIDTH = LEVEL_MAPS[0][0].length * TILE_SIZE, LEVEL_HEIGHT = LEVEL_MAPS[0].length * TILE_SIZE;


// --- Game State and Classes ---
let keys = {}, player, platforms, hazards, goal, camera = { x: 0, y: 0 },
    levelStartTime, animationFrameId, currentLevelIndex = 0, gameState = 'START';
let totalPlaythroughTime = 0, totalDeaths = 0;

function isColliding(rect1, rect2) { return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
class Player { /* ... (Player class remains unchanged) ... */ constructor(x, y) { this.width = TILE_SIZE - 8; this.height = TILE_SIZE * 1.5; this.pos = { x, y }; this.vel = { x: 0, y: 0 }; this.jumpsLeft = 2; this.onGround = false; this.isSprinting = false; this.sprintTimer = 0; this.sprintCooldownTimer = 0; } jump() { if (this.jumpsLeft > 0) { if (this.onGround && this.isSprinting) { this.vel.y = PLAYER_SPRINT_JUMP_STRENGTH; } else { this.vel.y = PLAYER_JUMP_STRENGTH; } this.jumpsLeft--; this.onGround = false; } } sprint() { if (this.onGround && performance.now() > this.sprintCooldownTimer) { this.isSprinting = true; this.sprintTimer = performance.now(); } } respawn(startPos) { this.pos.x = startPos.x; this.pos.y = startPos.y; this.vel = { x: 0, y: 0 }; this.onGround = false; this.isSprinting = false; } update(platforms) { let accX = 0; const moveForce = (this.isSprinting && this.onGround) ? PLAYER_SPRINT_ACC : PLAYER_ACC; if (keys['a'] || keys['ArrowLeft']) accX = -moveForce; if (keys['d'] || keys['ArrowRight']) accX = moveForce; if (this.isSprinting && performance.now() - this.sprintTimer > PLAYER_SPRINT_DURATION) { this.isSprinting = false; this.sprintCooldownTimer = performance.now() + PLAYER_SPRINT_COOLDOWN; } if (accX === 0) { accX += this.vel.x * PLAYER_FRICTION; } this.vel.x += accX; this.vel.y += PLAYER_GRAVITY; if (this.vel.y > TILE_SIZE) this.vel.y = TILE_SIZE; const maxSpeed = (this.isSprinting && this.onGround) ? 12 : 7; if (Math.abs(this.vel.x) > maxSpeed) { this.vel.x = Math.sign(this.vel.x) * maxSpeed; } const playerRect = { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height }; playerRect.y += this.vel.y; this.onGround = false; for (const p of platforms) { if (isColliding(playerRect, p)) { if (this.vel.y > 0) { playerRect.y = p.y - this.height; this.vel.y = 0; this.onGround = true; this.jumpsLeft = 2; } else if (this.vel.y < 0) { playerRect.y = p.y + p.height; this.vel.y = 0; } } } this.pos.y = playerRect.y; playerRect.x += this.vel.x; for (const p of platforms) { if (isColliding(playerRect, p)) { if (this.vel.x > 0) { playerRect.x = p.x - this.width; } else if (this.vel.x < 0) { playerRect.x = p.x + p.width; } this.vel.x = 0; } } this.pos.x = playerRect.x; } draw(ctx) { ctx.fillStyle = C_PLAYER; ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height); } }
class Platform { constructor(x, y) { this.x = x; this.y = y; this.width = TILE_SIZE; this.height = TILE_SIZE; } draw(ctx) { const grassHeight = 8; ctx.fillStyle = C_PLATFORM_GRASS; ctx.fillRect(this.x, this.y, this.width, grassHeight); ctx.fillStyle = C_PLATFORM_DIRT; ctx.fillRect(this.x, this.y + grassHeight, this.width, this.height - grassHeight); } }
class Hazard { constructor(x,y) { this.x = x; this.y = y + TILE_SIZE / 2; this.width = TILE_SIZE; this.height = TILE_SIZE / 2; } draw(ctx) { ctx.fillStyle = C_HAZARD; ctx.fillRect(this.x, this.y, this.width, this.height); } }
class Goal { constructor(x,y) { this.x = x; this.y = y; this.width = TILE_SIZE; this.height = TILE_SIZE; } draw(ctx) { ctx.fillStyle = C_GOAL; ctx.fillRect(this.x, this.y, this.width, this.height); } }

// --- Game Logic ---
let gameStartPos = { x: 0, y: 0 };
function initLevel(levelIndex) { platforms = []; hazards = []; let foundStart = false; const levelMap = LEVEL_MAPS[levelIndex]; levelMap.forEach((row, rowIndex) => { for (let colIndex = 0; colIndex < row.length; colIndex++) { const tile = row[colIndex]; const x = colIndex * TILE_SIZE; const y = rowIndex * TILE_SIZE; if (tile === 'P') { platforms.push(new Platform(x, y)); if (levelMap[rowIndex-1] && levelMap[rowIndex-1][colIndex] === 'S' && !foundStart) { gameStartPos = { x: x + (TILE_SIZE / 2) - ((TILE_SIZE-8)/2), y: y - (TILE_SIZE * 1.5) }; foundStart = true; } } else if (tile === 'H') hazards.push(new Hazard(x, y)); else if (tile === 'E') goal = new Goal(x, y); } }); player = new Player(gameStartPos.x, gameStartPos.y); }

function handleDeath() {
    totalDeaths++;
    player.respawn(gameStartPos);
}

function checkOtherCollisions() { const playerRect = { x: player.pos.x, y: player.pos.y, width: player.width, height: player.height }; for(const h of hazards) { if (isColliding(playerRect, h)) { handleDeath(); return; } } if (goal && isColliding(playerRect, goal)) { completeLevel(); return; } if (player.pos.y > LEVEL_HEIGHT + 200) { handleDeath(); } }
function update() { if (gameState !== 'PLAYING') return; player.update(platforms); checkOtherCollisions(); const targetCamX = player.pos.x + player.width / 2 - WIDTH / 2; const targetCamY = player.pos.y + player.height / 2 - HEIGHT / 2; camera.x += (targetCamX - camera.x) * 0.08; camera.y += (targetCamY - camera.y) * 0.08; if (camera.x < 0) camera.x = 0; if (camera.x > LEVEL_WIDTH - WIDTH) camera.x = LEVEL_WIDTH - WIDTH; if (camera.y < 0) camera.y = 0; if (camera.y > LEVEL_HEIGHT - HEIGHT) camera.y = LEVEL_HEIGHT - HEIGHT; const elapsedTime = (performance.now() - levelStartTime) / 1000; timerEl.textContent = `Time: ${elapsedTime.toFixed(2)}`; deathsCounter.textContent = `Deaths: ${totalDeaths}`; if (player.isSprinting) { sprintStatusEl.textContent = 'SPRINT!'; sprintStatusEl.style.color = C_PLAYER; } else if (performance.now() < player.sprintCooldownTimer) { sprintStatusEl.textContent = 'Cooldown'; sprintStatusEl.style.color = 'black'; } else { sprintStatusEl.textContent = 'Sprint Ready'; sprintStatusEl.style.color = 'green'; } }
function draw() { ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.save(); ctx.translate(-camera.x, -camera.y); platforms.forEach(p => p.draw(ctx)); hazards.forEach(h => h.draw(ctx)); if (goal) goal.draw(ctx); if (player) player.draw(ctx); ctx.restore(); }
function gameLoop() { if (gameState === 'START') return; update(); draw(); animationFrameId = requestAnimationFrame(gameLoop); }

// --- Game State Management ---
function startGame(levelIndex) {
    if (levelIndex === 0) {
        totalPlaythroughTime = 0;
        totalDeaths = 0;
    }
    currentLevelIndex = levelIndex;
    startScreen.style.display = 'none';
    intermissionScreen.style.display = 'none';
    gameCompleteScreen.style.display = 'none';
    gameUI.style.display = 'none';
    
    gameOverMusic.pause();
    gameOverMusic.currentTime = 0;
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(e => console.error("Audio play failed:", e));
    }

    initLevel(levelIndex);
    camera.x = player.pos.x - WIDTH / 2;
    gameState = 'LEVEL_START';
    levelBannerText.textContent = `Level ${levelIndex + 1}`;
    levelStartBanner.style.display = 'flex';
    
    if(animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
    
    setTimeout(() => {
        if (gameState !== 'LEVEL_START') return;
        levelStartBanner.style.display = 'none';
        gameUI.style.display = 'flex';
        levelStartTime = performance.now();
        gameState = 'PLAYING';
    }, 1500);
}

function completeLevel() {
    if (gameState !== 'PLAYING') return;
    cancelAnimationFrame(animationFrameId);
    const levelTime = (performance.now() - levelStartTime) / 1000;
    totalPlaythroughTime += levelTime;
    const isLastLevel = currentLevelIndex >= LEVEL_MAPS.length - 1;

    if (isLastLevel) {
        showGameCompleteScreen();
    } else {
        showIntermissionScreen();
    }
}

function showIntermissionScreen() { gameState = 'INTERMISSION'; gameUI.style.display = 'none'; intermissionScreen.style.display = 'flex'; }

function showGameCompleteScreen() {
    gameState = 'GAME_COMPLETE';
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    gameOverMusic.play().catch(e => console.error("Audio play failed:", e));
    gameUI.style.display = 'none';
    gameCompleteScreen.style.display = 'flex';
    finalTimeStat.textContent = `${totalPlaythroughTime.toFixed(2)}s`;
    finalDeathsStat.textContent = totalDeaths;
    nameInput.focus();
}

function showStartScreen() {
    gameState = 'START';
    startScreen.style.display = 'flex';
    intermissionScreen.style.display = 'none';
    gameCompleteScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    gameUI.style.display = 'none';
    gameOverMusic.pause();
    gameOverMusic.currentTime = 0;
    const leaderboard = loadLeaderboard();
    bestTimeEl.textContent = (leaderboard.length > 0)
        ? `Best Run: ${leaderboard[0].time.toFixed(2)}s, ${leaderboard[0].deaths} deaths`
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
            div = document.createElement('div');
            div.textContent = `${index + 1}. ${entry.name} - Time: ${entry.time.toFixed(2)}s, Deaths: ${entry.deaths}`;
            leaderboardListEl.appendChild(div);
        });
    }
}

function loadLeaderboard() { const data = localStorage.getItem('flowyJumperLeaderboard'); return data ? JSON.parse(data) : []; }

function saveLeaderboard(name, time, deaths) {
    if (!name) name = 'Anonymous';
    const leaderboard = loadLeaderboard();
    leaderboard.push({ name, time, deaths });
    leaderboard.sort((a, b) => { if (a.time < b.time) return -1; if (a.time > b.time) return 1; return a.deaths - b.deaths; });
    localStorage.setItem('flowyJumperLeaderboard', JSON.stringify(leaderboard.slice(0, 10)));
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => { keys[e.key] = true; if (gameState === 'PLAYING') { if (e.key === ' ' || e.key === 'w' || e.key === 'ArrowUp') { e.preventDefault(); player.jump(); } if (e.key === 'Shift') player.sprint(); if (e.key === 'r' || e.key === 'R') startGame(currentLevelIndex); } if (gameState === 'GAME_COMPLETE' && e.key === 'Enter') { submitScoreButton.click(); } });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });
startButton.addEventListener('click', () => { startGame(0); });
musicVolumeSlider.addEventListener('input', (e) => { gameSettings.musicVolume = e.target.value; applyAudioSettings(); saveSettings(); });
sfxVolumeSlider.addEventListener('input', (e) => { gameSettings.sfxVolume = e.target.value; saveSettings(); });
masterMuteCheckbox.addEventListener('change', (e) => { gameSettings.isMuted = e.target.checked; applyAudioSettings(); saveSettings(); });
leaderboardButton.addEventListener('click', showLeaderboard);
backButton.addEventListener('click', showStartScreen);
submitScoreButton.addEventListener('click', () => { saveLeaderboard(nameInput.value, totalPlaythroughTime, totalDeaths); nameInput.value = ''; showStartScreen(); });
replayButton.addEventListener('click', () => startGame(currentLevelIndex));
homeButton.addEventListener('click', showStartScreen);
nextLevelButton.addEventListener('click', () => startGame(currentLevelIndex + 1));

// --- Initial Call ---
loadSettings();
showStartScreen();
