const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const healthElement = document.getElementById('healthValue');
const finalScoreElement = document.getElementById('finalScoreValue');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// Set canvas size
canvas.width = 850;
canvas.height = 700;

// Game state
let score = 0;
let health = 100;
let gameRunning = false;
let currentLevel = 1;
let enemiesKilled = 0;
let bossSpawned = false;
let bossDefeated = false;

// Add player damage effect variables at the top with other game state
let playerDamageGlow = 0;
let playerInvincible = false;
let invincibilityTimer = 0;
let playerDamageTimer = 0;
const PLAYER_DAMAGE_DURATION = 10;

// Add screen shake variables at the top with other game variables
let screenShake = {
    intensity: 0,
    duration: 0,
    x: 0,
    y: 0
};

// Add health potion respawn variables at the top
let lastHealthPotionTime = 0;
const HEALTH_POTION_RESPAWN_TIME = 180000; // 3 minutes in milliseconds

// Arrays for game objects
const bullets = [];
const enemies = [];
const particles = [];
const explosions = [];
const enemyBullets = [];
const healthPotions = [];
let boss = null;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    speed: 5,
    angle: 0
};

// Controls state
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    w: false,
    a: false,
    s: false,
    d: false
};

// Mouse position
let mouseX = 0;
let mouseY = 0;

// Health Potion class
class HealthPotion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = '#4CAF50';
        this.glowColor = 'rgba(76, 175, 80, 0.7)';
        this.pulseSpeed = 0.05;
        this.pulseSize = 0;
        this.maxPulseSize = 5;
    }

    update() {
        // Update pulse effect
        this.pulseSize += this.pulseSpeed;
        if (this.pulseSize > this.maxPulseSize || this.pulseSize < 0) {
            this.pulseSpeed = -this.pulseSpeed;
        }
    }

    draw(ctx) {
        // Draw glow
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 15;

        // Draw potion
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + this.pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw plus symbol
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y);
        ctx.lineTo(this.x + 5, this.y);
        ctx.moveTo(this.x, this.y - 5);
        ctx.lineTo(this.x, this.y + 5);
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;
    }
}

// Base Enemy class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.color = '#ff0000';
        this.glowColor = 'rgba(255, 0, 0, 0.7)';
        this.rotation = 0;
        this.rotationSpeed = 0.02;
        this.shootCooldown = 0;
        this.shootInterval = 120; // Reduced from 180 to make enemies shoot more frequently
    }

    update() {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);

        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        // Update rotation
        this.rotation += this.rotationSpeed;

        // Shooting logic
        this.shootCooldown--;
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.shootInterval;
        }
    }

    shoot() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        enemyBullets.push(new EnemyBullet(this.x, this.y, angle));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw glow
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 15;

        // Draw enemy shape (triangle)
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, '#ff6666');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    explode() {
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 3 + 2;
            explosions.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 2,
                color: ['#ff0000', '#ff3333', '#ff6666'][Math.floor(Math.random() * 3)],
                alpha: 1,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }
}

// Boss class
class Boss extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 100;
        this.height = 100;
        this.hits = 0;
        this.maxHits = bossHitsRequired;
        this.speed = 1.5;
        this.shootCooldown = 0;
        this.shootInterval = 45;
        this.color = '#ff0000';
        this.glowColor = 'rgba(255, 0, 0, 0.7)';
        this.rotationSpeed = 0.03;
        console.log('Boss created with hits required:', this.maxHits); // Debug log
    }

    shoot() {
        if (!this || !this.x || !this.y) return;

        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        enemyBullets.push(new EnemyBullet(this.x, this.y, angle));
    }

    draw(ctx) {
        if (!this || !this.x || !this.y) return;

        super.draw(ctx);

        // Draw hit counter bar
        const barWidth = 150;
        const barHeight = 15;
        const x = this.x - barWidth / 2;
        const y = this.y - this.height / 2 - 25;

        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Progress
        const progressWidth = (this.hits / this.maxHits) * barWidth;
        const gradient = ctx.createLinearGradient(x, y, x + progressWidth, y);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#ff6666');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, progressWidth, barHeight);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Draw hit counter text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.hits}/${this.maxHits} Hits`, this.x, y - 5);

        // Draw level info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Level ${currentLevel} Boss`, this.x, y - 25);
    }

    takeDamage(amount) {
        this.hits++;  // Increment hit counter
        if (this.hits >= this.maxHits) {
            this.explode();
            bossDefeated = true;
            return true;
        }
        return false;
    }
}

// Enemy Bullet class
class EnemyBullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.radius = 6;
        this.speed = 4;
        this.color = '#00ff00';
        this.glowColor = 'rgba(0, 255, 0, 0.5)';
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    draw(ctx) {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = i / this.trail.length;
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.radius * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2
        );
        gradient.addColorStop(0, this.glowColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw bullet
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 && gameRunning) { // Left click
        shoot();
    }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Start game function
function startGame() {
    currentLevel = 1;
    enemiesRequired = 15;
    bossHitsRequired = 50;
    score = 0;
    player.health = 100;
    healthElement.textContent = player.health;
    enemiesKilled = 0;
    bossSpawned = false;
    bossDefeated = false;
    boss = null;
    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    explosions.length = 0;
    enemyBullets.length = 0;
    healthPotions.length = 0;

    scoreElement.textContent = score;
    healthElement.textContent = health;

    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    gameOverScreen.style.display = 'none';
    levelTransitionScreen.style.display = 'none';

    gameRunning = true;

    // Initialize health potion timer
    lastHealthPotionTime = Date.now();

    // Spawn initial health potion
    spawnHealthPotion();
}

// Game over function
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameScreen.style.display = 'none';
    gameOverScreen.style.display = 'flex';
}

// Enhanced bullet class
class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 10;
        this.radius = 5;
        this.color = '#ffffff';
        this.glowColor = 'rgba(255, 255, 255, 0.5)';
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.createParticles();
    }

    createParticles() {
        if (Math.random() < 0.3) {
            particles.push({
                x: this.x,
                y: this.y,
                radius: Math.random() * 2 + 1,
                color: '#ffffff',
                alpha: 1,
                speed: Math.random() * 2,
                angle: this.angle + (Math.random() - 0.5) * Math.PI / 4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    draw(ctx) {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = i / this.trail.length;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.radius * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2
        );
        gradient.addColorStop(0, this.glowColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw bullet
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Update shooting function
function shoot() {
    const bullet = new Bullet(player.x, player.y, player.angle);
    bullets.push(bullet);
}

// Update particle system
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;
        particle.alpha -= 0.02;
        particle.radius *= 0.95;

        if (particle.alpha <= 0 || particle.radius <= 0.1) {
            particles.splice(i, 1);
        }
    }
}

// Update explosion particles
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        if (!explosion) continue;

        explosion.x += explosion.vx;
        explosion.y += explosion.vy;
        explosion.alpha -= 0.02;
        explosion.rotation += explosion.rotationSpeed;

        if (explosion.alpha <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// Update createEnemy function
function createEnemy() {
    let x, y;
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

    switch (side) {
        case 0: // top
            x = Math.random() * canvas.width;
            y = -30;
            break;
        case 1: // right
            x = canvas.width + 30;
            y = Math.random() * canvas.height;
            break;
        case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 30;
            break;
        case 3: // left
            x = -30;
            y = Math.random() * canvas.height;
            break;
    }

    const enemy = new Enemy(x, y);
    enemies.push(enemy);
}

// Add boss spawn function
function spawnBoss() {
    const x = Math.random() * (canvas.width - 200) + 100;
    const y = Math.random() * (canvas.height - 200) + 100;
    boss = new Boss(x, y);
    showBossWarning();
}

// Add boss warning effect
function showBossWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 24px;
        z-index: 1000;
    `;
    // warning.textContent = `Level ${currentLevel} Boss!`;
    // document.body.appendChild(warning);

    setTimeout(() => {
        warning.remove();
    }, 2000);
}

// Create healing effect particles
function createHealingEffect() {
    // Create healing particles
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = Math.random() * 2 + 1;
        particles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 2,
            color: '#4CAF50',
            alpha: 1
        });
    }
}

// Spawn health potion
function spawnHealthPotion() {
    // Only spawn if there are no health potions
    if (healthPotions.length === 0) {
        const x = Math.random() * (canvas.width - 100) + 50;
        const y = Math.random() * (canvas.height - 100) + 50;
        healthPotions.push(new HealthPotion(x, y));
    }
}

// Update game state
function update() {
    if (!gameRunning) return;

    // Check for health potion respawn
    const currentTime = Date.now();
    if (currentTime - lastHealthPotionTime >= HEALTH_POTION_RESPAWN_TIME) {
        spawnHealthPotion();
        lastHealthPotionTime = currentTime;
    }

    // Update screen shake
    if (screenShake.duration > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.duration--;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }

    // Update player position with both arrow keys and WASD
    if (keys.ArrowLeft || keys.a) player.x = Math.max(player.width / 2, player.x - player.speed);
    if (keys.ArrowRight || keys.d) player.x = Math.min(canvas.width - player.width / 2, player.x + player.speed);
    if (keys.ArrowUp || keys.w) player.y = Math.max(player.height / 2, player.y - player.speed);
    if (keys.ArrowDown || keys.s) player.y = Math.min(canvas.height - player.height / 2, player.y + player.speed);

    // Update player angle
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    player.angle = Math.atan2(dy, dx);

    // Update player damage glow
    if (playerDamageGlow > 0) {
        playerDamageGlow -= 0.05;
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy) continue;

        enemy.update();

        // Check collision with player
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (enemy.width + player.width) / 2) {
            player.health -= 10;
            healthElement.textContent = player.health;
            enemies.splice(i, 1);

            // Trigger effects
            playerDamageTimer = PLAYER_DAMAGE_DURATION;
            applyScreenShake(8, 15); // Stronger shake for direct collision

            // Create collision particles
            for (let j = 0; j < 20; j++) {
                const angle = (Math.PI * 2 * j) / 20;
                const speed = Math.random() * 3 + 2;
                particles.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: Math.random() * 3 + 2,
                    color: '#ff0000',
                    alpha: 1
                });
            }

            if (player.health <= 0) {
                gameOver();
            }
        }
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet) continue;

        bullet.update();

        // Remove bullets that are off screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (!enemy) continue;

            if (checkBulletCollision(bullet, enemy)) {
                enemy.explode();
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 100;
                enemiesKilled++;
                scoreElement.textContent = score;
                break;
            }
        }

        // Check collision with boss
        if (boss && !bossDefeated && checkBulletCollision(bullet, boss)) {
            boss.hits++;
            bullets.splice(i, 1);

            // Create hit effect
            for (let k = 0; k < 10; k++) {
                particles.push({
                    x: bullet.x,
                    y: bullet.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: Math.random() * 3 + 1,
                    color: '#ff0000',
                    alpha: 1
                });
            }

            if (boss.hits >= boss.maxHits) {
                bossDefeated = true;
                score += 1000;
                scoreElement.textContent = score;

                // Create boss explosion
                for (let k = 0; k < 50; k++) {
                    const angle = (Math.PI * 2 * k) / 50;
                    const speed = Math.random() * 4 + 3;
                    explosions.push({
                        x: boss.x,
                        y: boss.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        radius: Math.random() * 4 + 3,
                        color: ['#ff0000', '#ff3333', '#ff6666', '#ff9999'][Math.floor(Math.random() * 4)],
                        alpha: 1,
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.2
                    });
                }

                boss = null;
                spawnHealthPotion();

                // Delay the level transition
                setTimeout(() => {
                    if (gameRunning) {
                        gameRunning = false;
                        showLevelTransition();
                    }
                }, 1000); // 1 second delay
            }
            break;
        }
    }

    // Update boss
    if (boss && !bossDefeated) {
        boss.update();
        boss.shootCooldown--;

        if (boss.shootCooldown <= 0) {
            boss.shoot();
            boss.shootCooldown = boss.shootInterval;
        }
    }

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (!bullet) continue;

        bullet.update();

        // Remove bullets that are off screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Check collision with player
        if (checkBulletCollision(bullet, player)) {
            player.health -= 10;
            healthElement.textContent = player.health;
            enemyBullets.splice(i, 1);

            // Trigger effects
            playerDamageTimer = PLAYER_DAMAGE_DURATION;
            applyScreenShake(5, 10); // Lighter shake for bullet hits

            // Create hit effect
            for (let j = 0; j < 10; j++) {
                particles.push({
                    x: bullet.x,
                    y: bullet.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: Math.random() * 3 + 1,
                    color: '#ff0000',
                    alpha: 1
                });
            }

            if (player.health <= 0) {
                gameOver();
            }
        }
    }

    // Check for level completion
    if (bossDefeated && levelTransitionScreen.style.display !== 'flex') {
        gameRunning = true; // Pause the game
        showLevelTransition();
    }

    // Spawn new enemies if needed
    if (!bossSpawned && enemies.length < 3 && enemiesKilled < enemiesRequired) {
        createEnemy();
    }

    // Spawn boss if conditions are met
    if (enemiesKilled >= enemiesRequired && !bossSpawned && !bossDefeated) {
        spawnBoss();
        bossSpawned = true;
    }

    // Update particles
    updateParticles();

    // Update explosions
    updateExplosions();

    // Update health potions
    for (let i = healthPotions.length - 1; i >= 0; i--) {
        const potion = healthPotions[i];
        if (!potion) continue;

        potion.update();

        // Check collision with player using distance
        const dx = potion.x - player.x;
        const dy = potion.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < potion.radius + player.width / 2) {
            player.health = Math.min(100, player.health + 50);
            healthElement.textContent = player.health;
            healthPotions.splice(i, 1);
            createHealingEffect();
        }
    }

    // Decrease player damage timer
    if (playerDamageTimer > 0) {
        playerDamageTimer--;
    }
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

function checkBulletCollision(bullet, enemy) {
    if (!bullet || !enemy) return false;

    // Use rectangle-based collision for more accurate detection
    return (
        bullet.x - bullet.radius < enemy.x + enemy.width / 2 &&
        bullet.x + bullet.radius > enemy.x - enemy.width / 2 &&
        bullet.y - bullet.radius < enemy.y + enemy.height / 2 &&
        bullet.y + bullet.radius > enemy.y - enemy.height / 2
    );
}

// Update draw function
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply screen shake
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Draw background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player
    drawPlayer(ctx);

    // Draw enemies
    enemies.forEach(enemy => enemy.draw(ctx));

    // Draw bullets
    bullets.forEach(bullet => bullet.draw(ctx));

    // Draw particles
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Draw explosions
    ctx.save();
    for (const explosion of explosions) {
        if (!explosion) continue;

        ctx.globalAlpha = explosion.alpha;
        ctx.translate(explosion.x, explosion.y);
        ctx.rotate(explosion.rotation);

        // Draw explosion particle
        ctx.beginPath();
        ctx.moveTo(-explosion.radius, -explosion.radius);
        ctx.lineTo(explosion.radius, -explosion.radius);
        ctx.lineTo(explosion.radius, explosion.radius);
        ctx.lineTo(-explosion.radius, explosion.radius);
        ctx.closePath();

        ctx.fillStyle = explosion.color;
        ctx.fill();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();

    // Draw enemy bullets
    enemyBullets.forEach(bullet => bullet.draw(ctx));

    // Draw boss if it exists
    if (boss) {
        boss.draw(ctx);
    }

    // Draw health potions
    for (const potion of healthPotions) {
        if (potion) {
            potion.draw(ctx);
        }
    }

    ctx.restore();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Add new function for player damage effect
function createPlayerDamageEffect() {
    playerDamageGlow = 1;
    playerInvincible = true;
    invincibilityTimer = 60; // 1 second of invincibility (60 frames)

    // Create damage particles
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = Math.random() * 3 + 2;
        particles.push({
            x: player.x,
            y: player.y,
            radius: Math.random() * 3 + 2,
            color: '#ff0000',
            alpha: 1,
            speed: speed,
            angle: angle,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
    }
}

// Update the level transition screen creation
const levelTransitionScreen = document.createElement('div');
levelTransitionScreen.id = 'levelTransitionScreen';
levelTransitionScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;
document.body.appendChild(levelTransitionScreen);

// Add level state variables
let enemiesRequired = 15; // Start with 15 enemies for level 1
let bossHitsRequired = 50; // Start with 50 hits for level 1

// Update the showLevelTransition function
function showLevelTransition() {
    // Update the level text
    levelTransitionScreen.innerHTML = `
        <div style="text-align: center; color: white;">
            <h2 style="font-size: 36px; margin-bottom: 20px;">Level Complete!</h2>
            <p style="font-size: 24px; margin-bottom: 30px;">Continue to Level ${currentLevel + 1}</p>
            <p style="font-size: 18px; margin-bottom: 20px; color: #4CAF50;">
                Next Level: ${currentLevel + 1 === 2 ? '25' : (15 + (currentLevel) * 10)} Enemies
                <br>
                Boss Health: ${currentLevel + 1 === 2 ? '75' : (50 + (currentLevel) * 25)} Hits
            </p>
            <button id="continueButton" style="
                padding: 15px 30px;
                font-size: 20px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s;
            ">Continue</button>
        </div>
    `;

    levelTransitionScreen.style.display = 'flex';

    // Add event listener to the continue button
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.onclick = function () {
            console.log('Continue button clicked'); // Debug log
            startNextLevel();
        };

        continueButton.onmouseover = function () {
            this.style.backgroundColor = '#45a049';
        };
        continueButton.onmouseout = function () {
            this.style.backgroundColor = '#4CAF50';
        };
    }
}

// Update the startNextLevel function
function startNextLevel() {
    // Increment level
    currentLevel++;
    console.log('Starting Level:', currentLevel); // Debug log

    // Set requirements based on level
    if (currentLevel === 2) {
        enemiesRequired = 25;
        bossHitsRequired = 75;
    } else {
        enemiesRequired = 15 + (currentLevel - 1) * 10;
        bossHitsRequired = 50 + (currentLevel - 1) * 25;
    }

    console.log('Level Requirements:', { enemiesRequired, bossHitsRequired }); // Debug log

    // Reset game state
    enemiesKilled = 0;
    bossSpawned = false;
    bossDefeated = false;
    boss = null;
    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    explosions.length = 0;
    enemyBullets.length = 0;
    healthPotions.length = 0;

    // Reset player position and health
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = 100;
    healthElement.textContent = player.health;

    // Hide transition screen
    levelTransitionScreen.style.display = 'none';

    // Spawn health potion
    spawnHealthPotion();

    // Update last health potion time
    lastHealthPotionTime = Date.now();

    // Ensure game is running
    gameRunning = true;

    // Start spawning enemies
    for (let i = 0; i < 3; i++) {
        createEnemy();
    }

    // Force a redraw
    draw();
}

// Update the player's draw function
function drawPlayer(ctx) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Draw player shadow/glow if damaged
    if (playerDamageTimer > 0) {
        ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
        ctx.shadowBlur = 30;
    } else {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 15;
    }

    // Draw player body (triangle)
    ctx.beginPath();
    ctx.moveTo(player.width / 2, 0);  // Nose of the triangle
    ctx.lineTo(-player.width / 2, -player.height / 2);  // Top left
    ctx.lineTo(-player.width / 2, player.height / 2);   // Bottom left
    ctx.closePath();

    // Fill with color based on damage
    ctx.fillStyle = playerDamageTimer > 0 ? '#ff4444' : '#ffffff';
    ctx.fill();

    // Draw player border
    ctx.lineWidth = 2;
    ctx.strokeStyle = playerDamageTimer > 0 ? '#ff0000' : '#ffffff';
    ctx.stroke();

    ctx.restore();
}

// Add screen shake function
function applyScreenShake(intensity = 5, duration = 10) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
} 