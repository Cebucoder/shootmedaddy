// Online player tracking system
class OnlineTracker {
    constructor() {
        this.players = new Map();
        this.currentPlayer = 'player1'; // Set default current player
        this.leaderboardElement = null;
        this.lastUpdateTime = 0;
        this.updateInterval = 100; // 100ms between updates
        this.isUpdating = false;
        this.pendingUpdate = false;
        this.initializeUI();
        this.setupRealtimeTracking();
        this.setupOtherPlayers();
        this.updateCurrentPlayer();

        // Listen for game start
        this.setupGameStartListener();
    }

    setupGameStartListener() {
        // Watch for the game screen to be displayed
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const gameScreen = document.getElementById('gameScreen');
                    if (gameScreen && gameScreen.style.display === 'block') {
                        this.ensureTrackerVisible();
                    }
                }
            });
        });

        // Start observing the game screen
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            observer.observe(gameScreen, {
                attributes: true,
                attributeFilter: ['style']
            });
        }

        // Also listen for the start button click
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                setTimeout(() => this.ensureTrackerVisible(), 100);
            });
        }
    }

    ensureTrackerVisible() {
        const tracker = document.getElementById('leaderboard-container');
        if (tracker) {
            tracker.style.display = 'block';
            this.updateCurrentPlayer();
        }
    }

    initializeUI() {
        // Create leaderboard container
        const leaderboardContainer = document.createElement('div');
        leaderboardContainer.id = 'leaderboard-container';
        leaderboardContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            padding: 20px;
            border-radius: 15px;
            color: white;
            font-family: 'Arial', sans-serif;
            z-index: 1000;
            min-width: 280px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
            border: 1px solid rgba(0, 255, 0, 0.3);
            backdrop-filter: blur(5px);
            transition: all 0.3s ease;
            display: none;
        `;

        // Create leaderboard header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid rgba(0, 255, 0, 0.3);
        `;

        // Create online indicator
        const onlineIndicator = document.createElement('div');
        onlineIndicator.style.cssText = `
            width: 10px;
            height: 10px;
            background: #00ff00;
            border-radius: 50%;
            margin-right: 10px;
            box-shadow: 0 0 10px #00ff00;
            animation: pulse 2s infinite;
        `;

        // Create title
        const title = document.createElement('h3');
        title.textContent = 'Online Players';
        title.style.cssText = `
            margin: 0;
            color: #00ff00;
            font-size: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            flex-grow: 1;
        `;

        // Create player count
        const playerCount = document.createElement('span');
        playerCount.id = 'player-count';
        playerCount.style.cssText = `
            background: rgba(0, 255, 0, 0.2);
            padding: 5px 10px;
            border-radius: 10px;
            font-size: 14px;
            color: #00ff00;
        `;

        // Add elements to header
        header.appendChild(onlineIndicator);
        header.appendChild(title);
        header.appendChild(playerCount);

        // Create leaderboard list
        this.leaderboardElement = document.createElement('ul');
        this.leaderboardElement.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 400px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #00ff00 rgba(0, 255, 0, 0.1);
        `;

        // Add custom scrollbar styles
        const style = document.createElement('style');
        style.textContent = `
            #leaderboard-container ul::-webkit-scrollbar {
                width: 6px;
            }
            #leaderboard-container ul::-webkit-scrollbar-track {
                background: rgba(0, 255, 0, 0.1);
                border-radius: 3px;
            }
            #leaderboard-container ul::-webkit-scrollbar-thumb {
                background: #00ff00;
                border-radius: 3px;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateX(20px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Add elements to container
        leaderboardContainer.appendChild(header);
        leaderboardContainer.appendChild(this.leaderboardElement);
        document.body.appendChild(leaderboardContainer);
    }

    updatePlayer(playerId, data) {
        const currentData = this.players.get(playerId);
        const newData = {
            ...currentData,
            ...data,
            lastUpdate: Date.now()
        };

        // Only update if there are actual changes
        if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
            this.players.set(playerId, newData);
            this.updateLeaderboard();
        }
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        if (!this.leaderboardElement) return;

        try {
            // Update player count
            const playerCount = document.getElementById('player-count');
            if (playerCount) {
                playerCount.textContent = `${this.players.size} Players`;
            }

            // Sort players by score
            const sortedPlayers = Array.from(this.players.entries())
                .sort(([, a], [, b]) => b.score - a.score);

            // Update existing elements instead of recreating them
            const existingElements = this.leaderboardElement.children;
            sortedPlayers.forEach(([id, player], index) => {
                let playerElement;
                if (index < existingElements.length) {
                    // Update existing element
                    playerElement = existingElements[index];
                } else {
                    // Create new element
                    playerElement = document.createElement('li');
                    this.leaderboardElement.appendChild(playerElement);
                }

                // Update element content
                playerElement.style.cssText = `
                    padding: 12px;
                    margin: 5px 0;
                    border-radius: 10px;
                    background: ${id === this.currentPlayer ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s ease;
                    border: 1px solid ${id === this.currentPlayer ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                `;

                const playerInfo = document.createElement('div');
                playerInfo.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;

                // Add rank
                const rank = document.createElement('span');
                rank.textContent = `#${index + 1}`;
                rank.style.cssText = `
                    color: ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#00ff00'};
                    font-weight: bold;
                    font-size: 16px;
                    min-width: 30px;
                `;

                // Add player name
                const nameElement = document.createElement('span');
                nameElement.textContent = player.name || 'Player ' + id;
                nameElement.style.cssText = `
                    color: ${id === this.currentPlayer ? '#00ff00' : 'white'};
                    font-weight: ${id === this.currentPlayer ? 'bold' : 'normal'};
                    font-size: 16px;
                `;

                const statsElement = document.createElement('div');
                statsElement.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 5px;
                `;

                // Add level badge
                const levelBadge = document.createElement('div');
                levelBadge.textContent = `Level ${player.level}`;
                levelBadge.style.cssText = `
                    background: rgba(0, 255, 0, 0.2);
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-size: 12px;
                    color: #00ff00;
                `;

                // Add score
                const scoreElement = document.createElement('div');
                scoreElement.textContent = `${player.score.toLocaleString()} pts`;
                scoreElement.style.cssText = `
                    color: #aaa;
                    font-size: 14px;
                `;

                // Add health bar
                const healthBar = document.createElement('div');
                healthBar.style.cssText = `
                    width: 60px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-top: 4px;
                `;

                const healthFill = document.createElement('div');
                healthFill.style.cssText = `
                    width: ${player.health}%;
                    height: 100%;
                    background: ${player.health > 50 ? '#00ff00' : player.health > 25 ? '#ffff00' : '#ff0000'};
                    transition: all 0.3s ease;
                `;

                healthBar.appendChild(healthFill);
                statsElement.appendChild(levelBadge);
                statsElement.appendChild(scoreElement);
                statsElement.appendChild(healthBar);

                playerInfo.appendChild(rank);
                playerInfo.appendChild(nameElement);
                playerElement.innerHTML = ''; // Clear existing content
                playerElement.appendChild(playerInfo);
                playerElement.appendChild(statsElement);
            });

            // Remove extra elements
            while (existingElements.length > sortedPlayers.length) {
                this.leaderboardElement.removeChild(existingElements[existingElements.length - 1]);
            }
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    }

    setCurrentPlayer(playerId) {
        this.currentPlayer = playerId;
        this.updateLeaderboard();
    }

    setupRealtimeTracking() {
        // Create a MutationObserver to watch for changes in score and health elements
        const observer = new MutationObserver(() => {
            this.scheduleUpdate();
        });

        // Start observing the score and health elements
        const scoreElement = document.getElementById('scoreValue');
        const healthElement = document.getElementById('healthValue');

        if (scoreElement) {
            observer.observe(scoreElement, {
                characterData: true,
                childList: true,
                subtree: true
            });
        }

        if (healthElement) {
            observer.observe(healthElement, {
                characterData: true,
                childList: true,
                subtree: true
            });
        }

        // Start the update loop
        this.startUpdateLoop();
    }

    startUpdateLoop() {
        const updateLoop = () => {
            const currentTime = performance.now();
            if (currentTime - this.lastUpdateTime >= this.updateInterval) {
                this.updateCurrentPlayer();
                this.lastUpdateTime = currentTime;
            }
            requestAnimationFrame(updateLoop);
        };
        requestAnimationFrame(updateLoop);
    }

    scheduleUpdate() {
        if (!this.pendingUpdate) {
            this.pendingUpdate = true;
            requestAnimationFrame(() => {
                this.updateCurrentPlayer();
                this.pendingUpdate = false;
            });
        }
    }

    updateCurrentPlayer() {
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            // Get game variables directly from game.js
            const gameScore = window.score || 0;
            const gameLevel = window.currentLevel || 1;
            const gameHealth = window.health || 100;

            // Update current player data
            this.updatePlayer('player1', {
                name: 'You',
                level: gameLevel,
                score: gameScore,
                health: gameHealth
            });

            // Force a leaderboard update
            this.updateLeaderboard();
        } catch (error) {
            console.error('Error updating current player:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    setupOtherPlayers() {
        // Add some initial other players
        const otherPlayers = [
            { id: 'player2', name: 'Player 2', level: 2, score: 1500, health: 85 },
            // { id: 'player3', name: 'Player 3', level: 1, score: 800, health: 100 },
            // { id: 'player4', name: 'Player 4', level: 3, score: 2500, health: 75 }
        ];

        otherPlayers.forEach(player => {
            this.updatePlayer(player.id, player);
        });

        // Update other players' scores periodically
        setInterval(() => {
            otherPlayers.forEach(player => {
                // Randomly update scores and levels
                const scoreChange = Math.floor(Math.random() * 100) - 20; // -20 to +80
                const newScore = Math.max(0, player.score + scoreChange);
                const newLevel = Math.max(1, Math.floor(newScore / 1000) + 1);
                const newHealth = Math.min(100, Math.max(0, player.health + (Math.random() * 20 - 10)));

                this.updatePlayer(player.id, {
                    ...player,
                    score: newScore,
                    level: newLevel,
                    health: newHealth
                });
            });
        }, 30000); // Update every 30 seconds
    }
}

// Create global tracker instance
const onlineTracker = new OnlineTracker();

// Update the leaderboard every second for current player
setInterval(() => {
    onlineTracker.updateCurrentPlayer();
}, 1000);

// Export the tracker for use in other files
window.onlineTracker = onlineTracker; 