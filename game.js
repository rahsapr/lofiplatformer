// --- Setup and DOM Elements ---
const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d'), startScreen = document.getElementById('startScreen'), intermissionScreen = document.getElementById('intermissionScreen'), gameCompleteScreen = document.getElementById('gameCompleteScreen'), leaderboardScreen = document.getElementById('leaderboardScreen'), deathScreen = document.getElementById('deathScreen'), pauseScreen = document.getElementById('pauseScreen'), powerupScreen = document.getElementById('powerupScreen'), gameUI = document.getElementById('gameUI'), startButton = document.getElementById('startButton'), leaderboardButton = document.getElementById('leaderboardButton'), backButton = document.getElementById('backButton'), submitScoreButton = document.getElementById('submitScoreButton'), replayButton = document.getElementById('replayButton'), homeButton = document.getElementById('homeButton'), nextLevelButton = document.getElementById('nextLevelButton'), restartFromDeathButton = document.getElementById('restartFromDeathButton'), homeFromDeathButton = document.getElementById('homeFromDeathButton'), resumeButton = document.getElementById('resumeButton'), pauseRestartButton = document.getElementById('pauseRestartButton'), pauseHomeButton = document.getElementById('pauseHomeButton'), continueButton = document.getElementById('continueButton'), nameInput = document.getElementById('nameInput'), bestTimeEl = document.getElementById('bestTime'), finalTimeStat = document.getElementById('finalTimeStat'), finalDeathsStat = document.getElementById('finalDeathsStat'), leaderboardListEl = document.getElementById('leaderboardList'), timerEl = document.getElementById('timer'), deathsCounter = document.getElementById('deathsCounter'), sprintStatusEl = document.getElementById('sprintStatus'), levelStartBanner = document.getElementById('levelStartBanner'), levelBannerText = document.getElementById('levelBannerText'), deathOptions = document.getElementById('deathOptions'), pauseLevelStat = document.getElementById('pauseLevelStat'), pauseTimeStat = document.getElementById('pauseTimeStat'), pauseDeathsStat = document.getElementById('pauseDeathsStat'), musicVolumeSlider = document.getElementById('musicVolumeSlider'), sfxVolumeSlider = document.getElementById('sfxVolumeSlider'), masterMuteCheckbox = document.getElementById('masterMuteCheckbox'), powerupNotification = document.getElementById('powerupNotification'), powerupMessage = document.getElementById('powerupMessage'), loadingScreen = document.getElementById('loadingScreen'), collectiblesCounter = document.getElementById('collectiblesCounter');

// --- Asset Loading ---
const sprites = {};
const spritePaths = {
    player_idle: 'assets/sprites/player/adventurer_idle.png',
    player_jump: 'assets/sprites/player/adventurer_jump.png',
    player_skid: 'assets/sprites/player/adventurer_skid.png',
    player_walk1: 'assets/sprites/player/adventurer_walk1.png',
    player_walk2: 'assets/sprites/player/adventurer_walk2.png',
    player_hold1: 'assets/sprites/player/adventurer_hold1.png',
    player_hold2: 'assets/sprites/player/adventurer_hold2.png',
    push_block: 'assets/sprites/world/box_to_be_pushed_tile_0009.png',
    collectible: 'assets/sprites/world/diamonds.png',
    flag1: 'assets/sprites/world/finish flag waving 1.png',
    flag2: 'assets/sprites/world/finish flag waving 2.png',
    ground_float_left: 'assets/sprites/world/floating block left.png',
    ground_float_mid: 'assets/sprites/world/floating block middle.png',
    ground_float_right: 'assets/sprites/world/floating block right.png',
    ground_float_single: 'assets/sprites/world/floating block small.png',
    ground_left: 'assets/sprites/world/grassy top groundtile_0000.png',
    ground_mid: 'assets/sprites/world/grassy top groundtile_0003.png',
    ground_right: 'assets/sprites/world/grassy top groundtile_0006.png',
    ground_single: 'assets/sprites/world/undergroundtile_0006.png',
    ground_dirt: 'assets/sprites/world/undergound_tile_0041.png',
    jump_pad_up: 'assets/sprites/world/jump_tile_extended_tile_0108.png',
    jump_pad_down: 'assets/sprites/world/jump_tile_contracted_tile_0107.png',
    spikes: 'assets/sprites/world/spikes_tile_0068.png',
    start_sign: 'assets/sprites/world/start_arrowhead_tile_0088.png',
    cloud_left: 'assets/sprites/scenery/cloud_left half.png',
    cloud_mid: 'assets/sprites/scenery/cloud middle.png',
    cloud_right: 'assets/sprites/scenery/cloud_right half.png',
    cloud_small: 'assets/sprites/scenery/cloud small.png',
    tree_top_mid: 'assets/sprites/scenery/tree_tile_0017.png',
    tree_trunk: 'assets/sprites/scenery/tree_trunk_tile_0052.png'
};

function loadAssets() { const promises = Object.entries(spritePaths).map(([key, path]) => { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { sprites[key] = img; resolve(); }; img.onerror = reject; img.src = path; }); }); return Promise.all(promises); }

// --- Audio & Settings ---
const backgroundMusic = new Audio('assets/background.mp3'); backgroundMusic.loop = true; const gameOverMusic = new Audio('assets/gameover.mp3'); gameOverMusic.loop = false;
let gameSettings = { musicVolume: 0.5, sfxVolume: 0.5, isMuted: false, gameSpeed: 1.0 }; let unlockedPowers = { canPush: false, canDash: false };
function saveSettings() { localStorage.setItem('flowyJumperSettings', JSON.stringify(gameSettings)); }
function loadSettings() { const saved = localStorage.getItem('flowyJumperSettings'); if (saved) { gameSettings = JSON.parse(saved); } if (typeof gameSettings.gameSpeed === 'undefined') { gameSettings.gameSpeed = 1.0; } musicVolumeSlider.value = gameSettings.musicVolume; sfxVolumeSlider.value = gameSettings.sfxVolume; masterMuteCheckbox.checked = gameSettings.isMuted; gameSpeedSlider.value = gameSettings.gameSpeed; applyAudioSettings(); }
function applyAudioSettings() { backgroundMusic.volume = gameSettings.musicVolume; gameOverMusic.volume = gameSettings.musicVolume; backgroundMusic.muted = gameSettings.isMuted; gameOverMusic.muted = gameSettings.isMuted; }
function saveProgress() { localStorage.setItem('flowyJumperProgress', JSON.stringify(unlockedPowers)); }
function loadProgress() { const saved = localStorage.getItem('flowyJumperProgress'); if (saved) { unlockedPowers = JSON.parse(saved); } }

// --- Constants ---
const WIDTH = 1024, HEIGHT = 768; canvas.width = WIDTH; canvas.height = HEIGHT;
const PLAYER_ACC = 0.4, PLAYER_SPRINT_ACC = 0.8, PLAYER_FRICTION = -0.12, PLAYER_GRAVITY = 0.8, PLAYER_JUMP_STRENGTH = -18, PLAYER_SPRINT_JUMP_STRENGTH = -22, PLAYER_SPRINT_DURATION = 250, PLAYER_SPRINT_COOLDOWN = 1000;
const PLAYER_DASH_SPEED = 14, PLAYER_DASH_DURATION = 150, UI_UPDATE_INTERVAL = 100, ANIMATION_SPEED = 150, JUMP_PAD_STRENGTH = -28;

// --- Game State & Classes ---
let keys = {}, player, platforms, pushableBlocks, hazards, goal, collectibles, jumpPads, scenery, camera = { x: 0, y: 0 },
    levelStartTime, pauseStartTime, animationFrameId, currentLevelIndex = 0, lastUiUpdateTime = 0, stateChangeTimestamp = 0;
let gameState = 'START';
let totalPlaythroughTime = 0, totalDeaths = 0, collectiblesCollected = 0;
let currentFocusIndex = 0;
let currentLevelWidth = 0, currentLevelHeight = 0;

function isColliding(rect1, rect2) { return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
class Player { constructor(x, y) { this.width = TILE_SIZE * 0.8; this.height = TILE_SIZE * 1.4; this.pos = { x, y }; this.vel = { x: 0, y: 0 }; this.jumpsLeft = 2; this.onGround = false; this.facingRight = true; this.isPushing = false; this.animationTimer = 0; this.animationFrame = 0; this.canDashInAir = true; this.isDashing = false; this.dashTimer = 0; this.isSprinting = false; this.sprintTimer = 0; this.sprintCooldownTimer = 0; } jump() { if (this.jumpsLeft > 0) { if (this.onGround && this.isSprinting) { this.vel.y = PLAYER_SPRINT_JUMP_STRENGTH; } else { this.vel.y = PLAYER_JUMP_STRENGTH; } this.jumpsLeft--; this.onGround = false; } } sprint() { if (this.onGround && performance.now() > this.sprintCooldownTimer) { this.isSprinting = true; this.sprintTimer = performance.now(); } } respawn(startPos) { this.pos.x = startPos.x; this.pos.y = startPos.y; this.vel = { x: 0, y: 0 }; this.onGround = false; this.isSprinting = false; this.isDashing = false; this.canDashInAir = true; } dash() { if (unlockedPowers.canDash && this.canDashInAir && !this.onGround) { this.isDashing = true; this.canDashInAir = false; this.dashTimer = performance.now(); const direction = (keys['arrowleft']) ? -1 : (keys['arrowright']) ? 1 : (this.vel.x !== 0 ? Math.sign(this.vel.x) : 1); this.vel.x = direction * PLAYER_DASH_SPEED * gameSettings.gameSpeed; this.vel.y = 0; } } 
    update(platforms, pushableBlocks) {
        if (this.isDashing) {
            this.vel.y = 0;
            if (performance.now() - this.dashTimer > PLAYER_DASH_DURATION) {
                this.isDashing = false; this.vel.y = -2; this.vel.x *= 0.5;
            } else {
                this.pos.x += this.vel.x;
                const playerRect = { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height };
                for(const p of [...platforms, ...pushableBlocks]) { if(isColliding(playerRect, p)) { this.pos.x = (this.vel.x > 0) ? p.x - this.width : p.x + p.width; this.isDashing = false; this.vel.x = 0; break; } }
                return;
            }
        }
        let accX = 0; const moveForce = ((this.isSprinting && this.onGround) ? PLAYER_SPRINT_ACC : PLAYER_ACC) * gameSettings.gameSpeed;
        if (keys['arrowleft']) accX = -moveForce; if (keys['arrowright']) accX = moveForce;
        if (this.isSprinting && performance.now() - this.sprintTimer > PLAYER_SPRINT_DURATION) { this.isSprinting = false; this.sprintCooldownTimer = performance.now() + PLAYER_SPRINT_COOLDOWN; }
        if (accX === 0) { accX += this.vel.x * PLAYER_FRICTION * gameSettings.gameSpeed; }
        this.vel.x += accX; this.vel.y += PLAYER_GRAVITY;
        if (this.vel.y > TILE_SIZE) this.vel.y = TILE_SIZE;
        const maxSpeed = ((this.isSprinting && this.onGround) ? 9 : 6) * gameSettings.gameSpeed;
        if (Math.abs(this.vel.x) > maxSpeed) { this.vel.x = Math.sign(this.vel.x) * maxSpeed; }
        
        const allObstacles = [...platforms, ...pushableBlocks];
        this.pos.y += this.vel.y;
        let playerRect = { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height };
        this.onGround = false;
        for (const p of allObstacles) { if (isColliding(playerRect, p)) { if (this.vel.y > 0) { this.pos.y = p.y - this.height; this.vel.y = 0; this.onGround = true; this.jumpsLeft = 2; this.canDashInAir = true; } else if (this.vel.y < 0) { this.pos.y = p.y + p.height; this.vel.y = 0; } } }
        
        this.pos.x += this.vel.x;
        playerRect = { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height };
        this.isPushing = false;
        for (const p of allObstacles) {
            if (isColliding(playerRect, p)) {
                if (p instanceof PushableBlock && unlockedPowers.canPush) {
                    this.isPushing = true;
                    if (p.push(this.vel.x, allObstacles)) {
                        this.pos.x = (this.vel.x > 0) ? p.x - this.width : p.x + p.width;
                    } else {
                        this.pos.x = (this.vel.x > 0) ? p.x - this.width : p.x + p.width; this.vel.x = 0;
                    }
                } else {
                    this.pos.x = (this.vel.x > 0) ? p.x - this.width : p.x + p.width; this.vel.x = 0;
                }
            }
        }
    }
    draw(ctx) { if (this.vel.x > 0.1) { this.facingRight = true; } else if (this.vel.x < -0.1) { this.facingRight = false; } this.animationTimer += 1000 / 60; if (this.animationTimer > ANIMATION_SPEED) { this.animationTimer = 0; this.animationFrame = (this.animationFrame + 1) % 2; } let imageToDraw; if (this.isDashing) { imageToDraw = sprites.player_skid; } else if (!this.onGround) { imageToDraw = sprites.player_jump; } else if (this.isPushing) { imageToDraw = this.animationFrame === 0 ? sprites.player_hold1 : sprites.player_hold2; } else if (Math.abs(this.vel.x) > 0.1) { imageToDraw = this.animationFrame === 0 ? sprites.player_walk1 : sprites.player_walk2; } else { imageToDraw = sprites.player_idle; } ctx.save(); if (!this.facingRight) { ctx.translate(this.pos.x + this.width, this.pos.y); ctx.scale(-1, 1); ctx.drawImage(imageToDraw, 0, 0, this.width, this.height); } else { ctx.drawImage(imageToDraw, this.pos.x, this.pos.y, this.width, this.height); } ctx.restore(); }
}
class PushableBlock { constructor(x, y) { this.x = x; this.y = y; this.width = TILE_SIZE; this.height = TILE_SIZE; } push(amount, obstacles) { const originalX = this.x; this.x += amount; for (const p of obstacles) { if (p === this) continue; if (isColliding(this, p)) { this.x = originalX; return false; } } return true; } draw(ctx) { ctx.drawImage(sprites.push_block, this.x, this.y, this.width, this.height); } }
class Platform { constructor(x, y) { this.x = x; this.y = y; this.width = TILE_SIZE; this.height = TILE_SIZE; this.sprite = sprites.ground_mid; this.isFloating = false; } setSprite(neighbors) { this.isFloating = !neighbors.bottom; if(this.isFloating) { if(!neighbors.left && !neighbors.right) this.sprite = sprites.ground_float_single; else if(!neighbors.left) this.sprite = sprites.ground_float_left; else if(!neighbors.right) this.sprite = sprites.ground_float_right; else this.sprite = sprites.ground_float_mid; } else { if(!neighbors.left && !neighbors.right) this.sprite = sprites.ground_single; else if(!neighbors.left) this.sprite = sprites.ground_left; else if(!neighbors.right) this.sprite = sprites.ground_right; else this.sprite = sprites.ground_mid; } } draw(ctx) { ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height); if(!this.isFloating) { for(let i = 1; i < 10; i++) { ctx.drawImage(sprites.ground_dirt, this.x, this.y + (TILE_SIZE * i), this.width, this.height); } } } }
class Hazard { constructor(x,y) { this.x = x; this.y = y + TILE_SIZE/2; this.width = TILE_SIZE; this.height = TILE_SIZE/2; } draw(ctx) { ctx.drawImage(sprites.spikes, this.x, this.y, this.width, this.height); } }
class Goal { constructor(x,y) { this.x = x; this.y = y-TILE_SIZE; this.width = TILE_SIZE; this.height = TILE_SIZE*2; this.animationTimer = 0; this.animationFrame = 0; } draw(ctx) { this.animationTimer += 1000/60; if(this.animationTimer > 200) { this.animationTimer = 0; this.animationFrame = (this.animationFrame + 1) % 2; } const image = this.animationFrame === 0 ? sprites.flag1 : sprites.flag2; ctx.drawImage(image, this.x, this.y, this.width, this.height); } }
class Scenery { constructor(x,y,sprite) { this.x=x;this.y=y;this.sprite=sprite; } draw(ctx) { ctx.drawImage(this.sprite, this.x, this.y); } }
class Collectible { constructor(x,y) { this.x=x;this.y=y;this.width=TILE_SIZE;this.height=TILE_SIZE; } draw(ctx) { ctx.drawImage(sprites.collectible, this.x, this.y, this.width, this.height); } }
class JumpPad { constructor(x,y) { this.x=x;this.y=y;this.width=TILE_SIZE;this.height=TILE_SIZE; this.isActive=false; this.activeTimer=0; } update() { if(this.isActive && performance.now() - this.activeTimer > 200) { this.isActive=false; } } draw(ctx) { const image = this.isActive ? sprites.jump_pad_up : sprites.jump_pad_down; ctx.drawImage(image, this.x, this.y, this.width, this.height); } }

// --- Game Logic ---
let gameStartPos = { x: 0, y: 0 };
function getTileAt(map, col, row) { if (row >= 0 && row < map.length && col >= 0 && col < map[row].length) { return map[row][col]; } return ' '; }
function initLevel(levelIndex) { platforms = []; pushableBlocks = []; hazards = []; collectibles = []; jumpPads = []; scenery = []; let foundStart = false; const levelMap = LEVEL_MAPS[levelIndex]; currentLevelHeight = levelMap.length * TILE_SIZE; currentLevelWidth = levelMap[0].length * TILE_SIZE; collectiblesCollected = 0; levelMap.forEach((row, rowIndex) => { for (let colIndex = 0; colIndex < row.length; colIndex++) { const tile = row[colIndex]; const x = colIndex * TILE_SIZE; const y = rowIndex * TILE_SIZE; if (tile === 'P') { platforms.push(new Platform(x, y)); } else if (tile === 'B') { pushableBlocks.push(new PushableBlock(x,y)); } else if (tile === 'H') { hazards.push(new Hazard(x, y)); } else if (tile === 'E') { goal = new Goal(x, y); } else if (tile === 'D') { collectibles.push(new Collectible(x,y)); } else if (tile === 'J') { jumpPads.push(new JumpPad(x,y)); } else if (tile === 'T') { scenery.push(new Scenery(x,y,sprites.tree_trunk)); } else if (tile === 'L') { scenery.push(new Scenery(x,y,sprites.tree_top_mid)); } else if (tile === 'C') { scenery.push(new Scenery(x,y,sprites.cloud_small)); } if (tile === 'S') { gameStartPos = { x: x + (TILE_SIZE / 2) - ((TILE_SIZE*0.8)/2), y: y - TILE_SIZE * 0.4 }; scenery.push(new Scenery(x,y+TILE_SIZE, sprites.start_sign)); } } }); platforms.forEach(p => { const col = p.x / TILE_SIZE; const row = p.y / TILE_SIZE; const neighbors = { top: getTileAt(levelMap, col, row-1) === 'P', bottom: getTileAt(levelMap, col, row+1) === 'P', left: getTileAt(levelMap, col-1, row) === 'P', right: getTileAt(levelMap, col+1, row) === 'P' }; p.setSprite(neighbors); }); player = new Player(gameStartPos.x, gameStartPos.y); }
function triggerDeathSequence() { if (gameState !== 'PLAYING') return; gameState = 'DEATH_SCREEN'; stateChangeTimestamp = performance.now(); totalDeaths++; backgroundMusic.pause(); gameOverMusic.currentTime = 0; gameOverMusic.play().catch(e => console.error("Game over audio failed:", e)); switchScreen(deathScreen); deathOptions.style.visibility = 'hidden'; }
function checkOtherCollisions() { const playerRect = { x: player.pos.x, y: player.pos.y, width: player.width, height: player.height }; for(let i = collectibles.length - 1; i >= 0; i--) { if(isColliding(playerRect, collectibles[i])) { collectibles.splice(i, 1); collectiblesCollected++; } } for(const pad of jumpPads) { if(player.vel.y > 0 && isColliding(playerRect, {x:pad.x, y:pad.y, width:pad.width, height:pad.height/2})) { if(player.pos.y + player.height < pad.y + pad.height/2) { player.vel.y = JUMP_PAD_STRENGTH; player.jumpsLeft = 2; player.canDashInAir = true; pad.isActive = true; pad.activeTimer = performance.now(); } } } for(const h of hazards) { if (isColliding(playerRect, h)) { triggerDeathSequence(); return; } } if (goal && isColliding(playerRect, {x:goal.x, y:goal.y+TILE_SIZE, width:goal.width, height:goal.height/2})) { completeLevel(); return; } if (player.pos.y > currentLevelHeight + 200) { triggerDeathSequence(); } }
function update() { if (gameState !== 'PLAYING') return; player.update(platforms, pushableBlocks); jumpPads.forEach(p => p.update()); checkOtherCollisions(); const targetCamX = player.pos.x + player.width / 2 - WIDTH / 2; const targetCamY = player.pos.y + player.height / 2 - HEIGHT / 2; camera.x += (targetCamX - camera.x) * 0.08; camera.y += (targetCamY - camera.y) * 0.08; if (camera.x < 0) camera.x = 0; if (camera.x > currentLevelWidth - WIDTH) camera.x = currentLevelWidth - WIDTH; if (camera.y < 0) camera.y = 0; if (camera.y > currentLevelHeight - HEIGHT) camera.y = currentLevelHeight - HEIGHT; const now = performance.now(); if (now - lastUiUpdateTime > UI_UPDATE_INTERVAL) { lastUiUpdateTime = now; const elapsedTime = (now - levelStartTime) / 1000; timerEl.textContent = `Time: ${elapsedTime.toFixed(2)}`; deathsCounter.textContent = `Deaths: ${totalDeaths}`; collectiblesCounter.textContent = `💎 ${collectiblesCollected}`; if (player.isSprinting) { sprintStatusEl.textContent = 'SPRINT!'; sprintStatusEl.style.color = '#ff7847'; } else if (now < player.sprintCooldownTimer) { sprintStatusEl.textContent = 'Cooldown'; sprintStatusEl.style.color = 'black'; } else { sprintStatusEl.textContent = 'Sprint Ready'; sprintStatusEl.style.color = 'green'; } } }
function draw() { ctx.clearRect(0, 0, WIDTH, HEIGHT); scenery.forEach(s => s.draw(ctx)); ctx.save(); ctx.translate(-camera.x, -camera.y); platforms.forEach(p => p.draw(ctx)); pushableBlocks.forEach(b => b.draw(ctx)); hazards.forEach(h => h.draw(ctx)); collectibles.forEach(c => c.draw(ctx)); jumpPads.forEach(j => j.draw(ctx)); if (goal) goal.draw(ctx); if (player) player.draw(ctx); ctx.restore(); }
function gameLoop() { const now = performance.now(); if (gameState === 'LEVEL_START' && now - stateChangeTimestamp > 1500) { switchScreen(gameUI); levelStartTime = now; lastUiUpdateTime = now; gameState = 'PLAYING'; } if (gameState === 'DEATH_SCREEN' && now - stateChangeTimestamp > 2000) { if (deathOptions.style.visibility === 'hidden') { deathOptions.style.visibility = 'visible'; setFocus(0); } } update(); draw(); if (gameState !== 'START') { animationFrameId = requestAnimationFrame(gameLoop); } }
const focusableElements = { START: '#startScreen .focusable', INTERMISSION: '#intermissionScreen .focusable', GAME_COMPLETE: '#gameCompleteScreen .focusable', LEADERBOARD: '#leaderboardScreen .focusable', DEATH_SCREEN: '#deathScreen .focusable', PAUSED: '#pauseScreen .focusable', POWERUP: '#powerupScreen .focusable' };
function updateFocus(direction) { const selector = focusableElements[gameState]; if (!selector) return; const elements = Array.from(document.querySelectorAll(selector)); if (elements.length === 0) return; elements[currentFocusIndex]?.classList.remove('focused'); currentFocusIndex += direction; if (currentFocusIndex >= elements.length) currentFocusIndex = 0; if (currentFocusIndex < 0) currentFocusIndex = elements.length - 1; elements[currentFocusIndex]?.classList.add('focused'); }
function setFocus(index) { currentFocusIndex = index; updateFocus(0); }
function switchScreen(screenToShow) { [startScreen, intermissionScreen, gameCompleteScreen, leaderboardScreen, deathScreen, pauseScreen, powerupScreen, gameUI, levelStartBanner].forEach(s => s.style.display = 'none'); screenToShow.style.display = 'flex'; }
function startGame(levelIndex) { if (levelIndex === 0) { totalPlaythroughTime = 0; totalDeaths = 0; loadProgress(); } currentLevelIndex = levelIndex; gameOverMusic.pause(); gameOverMusic.currentTime = 0; if (backgroundMusic.paused) { backgroundMusic.play().catch(e => console.error("Audio play failed:", e)); } initLevel(levelIndex); camera.x = player.pos.x - WIDTH / 2; gameState = 'LEVEL_START'; stateChangeTimestamp = performance.now(); levelBannerText.textContent = `Level ${levelIndex + 1}`; switchScreen(levelStartBanner); if(animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = requestAnimationFrame(gameLoop); }
function completeLevel() { if (gameState !== 'PLAYING') return; gameState = 'INTERMISSION'; cancelAnimationFrame(animationFrameId); const levelTime = (performance.now() - levelStartTime) / 1000; totalPlaythroughTime += levelTime; let newPowerUnlocked = false; let powerupMsg = ""; if(currentLevelIndex === 2 && !unlockedPowers.canPush) { unlockedPowers.canPush = true; newPowerUnlocked = true; powerupMsg = "You can now PUSH orange blocks! Controls: Walk into them."; } if(currentLevelIndex === 6 && !unlockedPowers.canDash) { unlockedPowers.canDash = true; newPowerUnlocked = true; powerupMsg = "You can now AIR DASH! Controls: Press [X] in mid-air."; } if(newPowerUnlocked) { saveProgress(); showPowerupScreen(powerupMsg); } else { const isLastLevel = currentLevelIndex >= LEVEL_MAPS.length - 1; if (isLastLevel) { showGameCompleteScreen(); } else { showIntermissionScreen(); } } }
function showPowerupScreen(message) { gameState = 'POWERUP'; powerupMessage.textContent = message; switchScreen(powerupScreen); setFocus(0); }
function showIntermissionScreen() { gameState = 'INTERMISSION'; switchScreen(intermissionScreen); setFocus(0); }
function showGameCompleteScreen() { gameState = 'GAME_COMPLETE'; backgroundMusic.pause(); backgroundMusic.currentTime = 0; gameOverMusic.play().catch(e => console.error("Audio play failed:", e)); switchScreen(gameCompleteScreen); setFocus(0); finalTimeStat.textContent = `${totalPlaythroughTime.toFixed(2)}s`; finalDeathsStat.textContent = totalDeaths; nameInput.focus(); }
function showStartScreen() { gameState = 'START'; switchScreen(startScreen); gameOverMusic.pause(); gameOverMusic.currentTime = 0; const leaderboard = loadLeaderboard(); bestTimeEl.textContent = (leaderboard.length > 0) ? `Best Run: ${leaderboard[0].time.toFixed(2)}s, ${leaderboard[0].deaths} deaths` : 'Be the first to set a time!'; setFocus(0); }
function showLeaderboard() { gameState = 'LEADERBOARD'; switchScreen(leaderboardScreen); const leaderboard = loadLeaderboard(); leaderboardListEl.innerHTML = ''; if (leaderboard.length === 0) { leaderboardListEl.innerHTML = '<div>No scores yet!</div>'; } else { leaderboard.forEach((entry, index) => { let div = document.createElement('div'); div.textContent = `${index + 1}. ${entry.name} - Time: ${entry.time.toFixed(2)}s, Deaths: ${entry.deaths}`; leaderboardListEl.appendChild(div); }); } setFocus(0); }
function togglePause() { if (gameState === 'PLAYING') { gameState = 'PAUSED'; pauseStartTime = performance.now(); cancelAnimationFrame(animationFrameId); pauseLevelStat.textContent = currentLevelIndex + 1; pauseTimeStat.textContent = `${((performance.now() - levelStartTime) / 1000).toFixed(2)}s`; pauseDeathsStat.textContent = totalDeaths; switchScreen(pauseScreen); setFocus(0); } else if (gameState === 'PAUSED') { gameState = 'PLAYING'; const pausedDuration = performance.now() - pauseStartTime; levelStartTime += pausedDuration; switchScreen(gameUI); animationFrameId = requestAnimationFrame(gameLoop); } }
function loadLeaderboard() { const data = localStorage.getItem('flowyJumperLeaderboard'); return data ? JSON.parse(data) : []; }
function saveLeaderboard(name, time, deaths) { if (!name) name = 'Anonymous'; const leaderboard = loadLeaderboard(); leaderboard.push({ name, time, deaths }); leaderboard.sort((a, b) => { if (a.time < b.time) return -1; if (a.time > b.time) return 1; return a.deaths - b.deaths; }); localStorage.setItem('flowyJumperLeaderboard', JSON.stringify(leaderboard.slice(0, 10))); }

// --- Event Listeners ---
window.addEventListener('keydown', (e) => { const key = e.key.toLowerCase(); keys[key] = true; if (gameState === 'PLAYING') { if (key === 'arrowup' || key === ' ') { e.preventDefault(); player.jump(); } if (key === 'shift') { player.sprint(); } if (key === 'x') { player.dash(); } if (key === 'r') { triggerDeathSequence(); } if (key === 'escape') { e.preventDefault(); togglePause(); } } else { if (key === 'arrowdown' || key === 'tab') { e.preventDefault(); updateFocus(1); } if (key === 'arrowup') { e.preventDefault(); updateFocus(-1); } if (key === 'enter') { e.preventDefault(); const focusedElement = document.querySelector('.focusable.focused'); focusedElement?.click(); } if (key === 'escape' && gameState === 'PAUSED') { e.preventDefault(); togglePause(); } } });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
startButton.addEventListener('click', () => { startGame(0); });
gameSpeedSlider.addEventListener('input', (e) => { gameSettings.gameSpeed = parseFloat(e.target.value); saveSettings(); });
musicVolumeSlider.addEventListener('input', (e) => { gameSettings.musicVolume = e.target.value; applyAudioSettings(); saveSettings(); });
sfxVolumeSlider.addEventListener('input', (e) => { gameSettings.sfxVolume = e.target.value; saveSettings(); });
masterMuteCheckbox.addEventListener('change', (e) => { gameSettings.isMuted = e.target.checked; applyAudioSettings(); saveSettings(); });
leaderboardButton.addEventListener('click', showLeaderboard);
backButton.addEventListener('click', showStartScreen);
submitScoreButton.addEventListener('click', () => { saveLeaderboard(nameInput.value, totalPlaythroughTime, totalDeaths); nameInput.value = ''; showStartScreen(); });
replayButton.addEventListener('click', () => startGame(currentLevelIndex));
homeButton.addEventListener('click', showStartScreen);
nextLevelButton.addEventListener('click', () => startGame(currentLevelIndex + 1));
restartFromDeathButton.addEventListener('click', () => startGame(currentLevelIndex));
homeFromDeathButton.addEventListener('click', showStartScreen);
resumeButton.addEventListener('click', togglePause);
pauseRestartButton.addEventListener('click', () => startGame(currentLevelIndex));
pauseHomeButton.addEventListener('click', showStartScreen);
continueButton.addEventListener('click', () => { const isLastLevel = currentLevelIndex >= LEVEL_MAPS.length - 1; if (isLastLevel) { showGameCompleteScreen(); } else { showIntermissionScreen(); } });

// --- Initial Call ---
loadAssets().then(() => {
    console.log("All assets loaded successfully!");
    loadingScreen.style.display = 'none';
    startButton.disabled = false;
    loadSettings();
    loadProgress();
    showStartScreen();
}).catch(error => {
    console.error("Error loading assets:", error);
    loadingScreen.innerHTML = "<h1>Error loading assets. Please refresh.</h1>";
});