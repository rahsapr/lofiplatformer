const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRAVITY = 0.4;
const JUMP_POWER = -8;
const DOUBLE_JUMP_POWER = -7;
const PLAYER_SIZE = 32;

// Terrain generation
function generateTerrain(width, height, blockSize) {
    let terrain = [];
    let amplitude = 50, freq = 0.03;
    for (let x = 0; x < width; x += blockSize) {
        let y = Math.floor(height / 2 + Math.sin(x * freq) * amplitude + Math.random() * 10);
        terrain.push({ x, y });
    }
    return terrain;
}

// Player
class Player {
    constructor() {
        this.x = 40;
        this.y = 100;
        this.vx = 0;
        this.vy = 0;
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        this.onGround = false;
        this.canDoubleJump = true;
    }
    update(terrain) {
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        // Simple collision with terrain blocks
        for (let block of terrain) {
            if (
                this.x + this.width > block.x &&
                this.x < block.x + 32 &&
                this.y + this.height > block.y &&
                this.y + this.height < block.y + 16
            ) {
                this.y = block.y - this.height;
                this.vy = 0;
                this.onGround = true;
                this.canDoubleJump = true;
                break;
            } else {
                this.onGround = false;
            }
        }
    }
    jump() {
        if (this.onGround) {
            this.vy = JUMP_POWER;
            this.onGround = false;
        } else if (this.canDoubleJump) {
            this.vy = DOUBLE_JUMP_POWER;
            this.canDoubleJump = false;
        }
    }
    draw() {
        // Draw a cute placeholder "spirit" (circle with face)
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#e3f2fd";
        ctx.shadowColor = "#aaf";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#90caf9";
        ctx.stroke();

        // Eyes
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 7, this.y + this.height / 2 - 3, 3, 0, Math.PI * 2);
        ctx.arc(this.x + this.width / 2 + 7, this.y + this.height / 2 - 3, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#1565c0";
        ctx.fill();

        // Smile
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2 + 4, 7, Math.PI * 0.15, Math.PI * 0.85);
        ctx.strokeStyle = "#1976d2";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

// Input
let keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') player.jump();
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Game setup
const terrain = generateTerrain(canvas.width, canvas.height, 32);
const player = new Player();

function drawTerrain() {
    for (let block of terrain) {
        ctx.fillStyle = block.y < canvas.height / 2 ? '#388e3c' : '#795548';
        ctx.fillRect(block.x, block.y, 32, 16);
    }
}

function drawStartEnd() {
    // Start area (glow)
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#b4ffb4';
    ctx.beginPath();
    ctx.arc(60, terrain[2].y - 20, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // End area (checkered flag placeholder)
    const flagX = canvas.width - 60;
    const flagY = terrain[terrain.length - 2].y - 32;
    ctx.save();
    ctx.translate(flagX, flagY);
    // Flag pole
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(0, 0);
    ctx.stroke();
    // Flag
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? "#fff" : "#222";
            ctx.fillRect(3 + i * 6, j * 6, 6, 6);
        }
    }
    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTerrain();
    drawStartEnd();

    // Player movement
    player.vx = 0;
    if (keys['ArrowLeft']) player.vx = -3;
    if (keys['ArrowRight']) player.vx = 3;

    player.update(terrain);
    player.draw();

    // TODO: Obstacles, collision, win condition
    requestAnimationFrame(gameLoop);
}
gameLoop();
