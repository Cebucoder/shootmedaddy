class PowerUpSystem {
    constructor(config) {
        this.canvas = config.canvas;
        this.container = config.container;
        this.player = config.player;
        this.currentLevel = config.currentLevel;
        this.isGameActive = config.isGameActive;
        this.handlePlayerHit = config.handlePlayerHit;
        this.activePowerUps = new Map();
        this.spawnInterval = null;
        this.powerUpTypes = {
            shield: { color: '#00ffff', duration: 10000, effect: this.activateShield.bind(this) },
            doubleDamage: { color: '#ff0000', duration: 8000, effect: this.activateDoubleDamage.bind(this) },
            speedBoost: { color: '#00ff00', duration: 5000, effect: this.activateSpeedBoost.bind(this) },
            healthRegen: { color: '#ff00ff', duration: 15000, effect: this.activateHealthRegen.bind(this) }
        };
        this.setupStyles();
    }

    start() {
        // Clear any existing spawn interval
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }

        // Start spawning power-ups every 30 seconds
        this.spawnInterval = setInterval(() => {
            if (this.isGameActive) {
                this.spawnPowerUp();
            }
        }, 30000);

        // Spawn initial power-up
        this.spawnPowerUp();
    }

    stop() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }
        this.clearAllPowerUps();
    }

    spawnPowerUp() {
        const types = Object.keys(this.powerUpTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        const powerUp = this.powerUpTypes[randomType];

        const powerUpElement = document.createElement('div');
        powerUpElement.className = 'power-up';
        powerUpElement.style.backgroundColor = powerUp.color;
        powerUpElement.setAttribute('data-type', randomType);

        // Position power-up randomly within the game container
        const containerRect = this.container.getBoundingClientRect();
        const x = Math.random() * (containerRect.width - 30);
        const y = Math.random() * (containerRect.height - 30);

        powerUpElement.style.left = `${x}px`;
        powerUpElement.style.top = `${y}px`;

        this.container.appendChild(powerUpElement);

        // Add hover effect
        powerUpElement.addEventListener('mouseover', () => {
            powerUpElement.style.transform = 'scale(1.2)';
        });

        powerUpElement.addEventListener('mouseout', () => {
            powerUpElement.style.transform = 'scale(1)';
        });

        // Check for collision with player
        const checkCollision = () => {
            if (!powerUpElement.parentNode) return;

            const powerUpRect = powerUpElement.getBoundingClientRect();
            const playerRect = this.player.getBoundingClientRect();

            if (this.isColliding(powerUpRect, playerRect)) {
                this.activatePowerUp(randomType);
                powerUpElement.remove();
                return;
            }

            requestAnimationFrame(checkCollision);
        };

        checkCollision();
    }

    activatePowerUp(type) {
        const powerUp = this.powerUpTypes[type];
        if (!powerUp) return;

        // Remove existing power-up of same type
        if (this.activePowerUps.has(type)) {
            const existing = this.activePowerUps.get(type);
            clearTimeout(existing.timeout);
            powerUp.remove(this.game.player);
            if (existing.indicator) {
                existing.indicator.remove();
            }
        }

        // Apply new power-up
        powerUp.effect(this.game.player);

        // Create visual indicator
        const indicator = document.createElement('div');
        indicator.className = 'power-up-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
            background: ${powerUp.color};
            border-radius: 50%;
            box-shadow: 0 0 5px ${powerUp.color};
            animation: pulse 1s infinite;
            z-index: 1000;
        `;
        document.body.appendChild(indicator);

        // Show notification
        this.showNotification(type);

        // Set timeout to remove power-up
        const timeout = setTimeout(() => {
            powerUp.remove(this.game.player);
            indicator.remove();
            this.activePowerUps.delete(type);
            this.showNotification(`${type} expired`);
        }, powerUp.duration);

        this.activePowerUps.set(type, { timeout, indicator });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'power-up-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 2000;
            animation: fadeOut 2s forwards;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    setupCustomEnemies() {
        // Override the game's enemy creation
        const originalCreateEnemy = this.game.createEnemy;
        this.game.createEnemy = () => {
            const level = this.game.currentLevel;
            const enemyType = this.levelEnemies[level] || this.levelEnemies[1];

            const enemy = document.createElement('div');
            enemy.className = 'enemy';
            enemy.style.cssText = `
                position: absolute;
                width: 40px;
                height: 40px;
                background: ${enemyType.color};
                border-radius: 50%;
                box-shadow: 0 0 10px ${enemyType.color};
            `;

            // Set enemy properties
            enemy.health = enemyType.health;
            enemy.speed = enemyType.speed;
            enemy.damage = enemyType.damage;
            enemy.points = enemyType.points;
            enemy.type = enemyType.type;

            // Add to game
            this.game.container.appendChild(enemy);

            // Setup enemy behavior based on type
            switch (enemyType.type) {
                case 'shooter':
                    this.setupShooterBehavior(enemy, enemyType);
                    break;
                case 'boss':
                    this.setupBossBehavior(enemy, enemyType);
                    break;
                default:
                    this.setupBasicBehavior(enemy, enemyType);
            }

            return enemy;
        };
    }

    setupShooterBehavior(enemy, type) {
        setInterval(() => {
            if (!enemy.parentNode) return;

            const bullet = document.createElement('div');
            bullet.className = 'enemy-bullet';
            bullet.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${type.color};
                border-radius: 50%;
                box-shadow: 0 0 5px ${type.color};
            `;

            const enemyRect = enemy.getBoundingClientRect();
            const playerRect = this.game.player.getBoundingClientRect();

            // Calculate direction to player
            const dx = playerRect.left - enemyRect.left;
            const dy = playerRect.top - enemyRect.top;
            const angle = Math.atan2(dy, dx);

            bullet.style.left = `${enemyRect.left}px`;
            bullet.style.top = `${enemyRect.top}px`;

            this.game.container.appendChild(bullet);

            // Move bullet
            const speed = 5;
            const moveBullet = () => {
                if (!bullet.parentNode) return;

                const currentLeft = parseFloat(bullet.style.left);
                const currentTop = parseFloat(bullet.style.top);

                bullet.style.left = `${currentLeft + Math.cos(angle) * speed}px`;
                bullet.style.top = `${currentTop + Math.sin(angle) * speed}px`;

                // Check collision with player
                const bulletRect = bullet.getBoundingClientRect();
                const playerRect = this.game.player.getBoundingClientRect();

                if (this.isColliding(bulletRect, playerRect)) {
                    this.game.handlePlayerHit(type.damage);
                    bullet.remove();
                } else if (this.isOutOfBounds(bullet)) {
                    bullet.remove();
                } else {
                    requestAnimationFrame(moveBullet);
                }
            };

            moveBullet();
        }, type.shootInterval);
    }

    setupBossBehavior(enemy, type) {
        let phase = 'normal';
        let healthThreshold = type.health * 0.5;

        const updateBoss = () => {
            if (!enemy.parentNode) return;

            if (enemy.health <= healthThreshold && phase === 'normal') {
                phase = 'enraged';
                enemy.style.background = '#ff0000';
                enemy.style.boxShadow = '0 0 20px #ff0000';
                enemy.speed *= 1.5;
                type.shootInterval = 500;
            }

            // Move towards player
            const enemyRect = enemy.getBoundingClientRect();
            const playerRect = this.game.player.getBoundingClientRect();

            const dx = playerRect.left - enemyRect.left;
            const dy = playerRect.top - enemyRect.top;
            const angle = Math.atan2(dy, dx);

            enemy.style.left = `${enemyRect.left + Math.cos(angle) * enemy.speed}px`;
            enemy.style.top = `${enemyRect.top + Math.sin(angle) * enemy.speed}px`;

            requestAnimationFrame(updateBoss);
        };

        updateBoss();
    }

    setupBasicBehavior(enemy, type) {
        const moveEnemy = () => {
            if (!enemy.parentNode) return;

            const enemyRect = enemy.getBoundingClientRect();
            const playerRect = this.game.player.getBoundingClientRect();

            const dx = playerRect.left - enemyRect.left;
            const dy = playerRect.top - enemyRect.top;
            const angle = Math.atan2(dy, dx);

            enemy.style.left = `${enemyRect.left + Math.cos(angle) * enemy.speed}px`;
            enemy.style.top = `${enemyRect.top + Math.sin(angle) * enemy.speed}px`;

            requestAnimationFrame(moveEnemy);
        };

        moveEnemy();
    }

    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom);
    }

    isOutOfBounds(element) {
        const rect = element.getBoundingClientRect();
        return rect.right < 0 ||
            rect.left > this.game.canvas.width ||
            rect.bottom < 0 ||
            rect.top > this.game.canvas.height;
    }

    setupStyles() {
        // Add styles to document head
        const style = document.createElement('style');
        style.textContent = `
            .power-up {
                position: absolute;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                transition: transform 0.2s;
                z-index: 1000;
                box-shadow: 0 0 10px currentColor;
                animation: pulse 1s infinite;
            }

            .power-up:hover {
                transform: scale(1.2);
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            .power-up-effect {
                position: absolute;
                pointer-events: none;
                z-index: 999;
            }

            .power-up-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 2000;
                animation: fadeInOut 3s forwards;
            }

            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -20px); }
                10% { opacity: 1; transform: translate(-50%, 0); }
                90% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head.appendChild(style);
    }
} 