// Online player tracking system
class OnlineTracker {
    constructor() {
        this.players = new Map();
        this.currentPlayer = 'player1';
        this.leaderboardElement = null;
        this.lastUpdateTime = 0;
        this.updateInterval = 50; // Update every 50ms for smoother health updates
        this.isUpdating = false;
        this.pendingUpdate = false;
        this.playerCounter = 1;
        this.username = '';
        this.heartbeatInterval = 2000; // 2 seconds heartbeat
        this.onlineTimeout = 5000; // 5 seconds timeout
        this.initializeUI();
        this.setupRealtimeTracking();
        this.setupOtherPlayers();
        this.updateCurrentPlayer();

        // Listen for game start
        this.setupGameStartListener();

        // Get username from input if available
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) {
            this.username = usernameInput.value || 'Player';
            usernameInput.addEventListener('input', (e) => {
                this.username = e.target.value || 'Player';
                this.updateCurrentPlayer();
            });
        }

        // Listen for other players' updates
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith('player_')) {
                const playerData = JSON.parse(event.newValue);
                if (playerData) {
                    if (playerData.id !== this.currentPlayer) {
                        this.updatePlayer(playerData.id, playerData);
                        this.updateLeaderboard();
                    }
                }
            }
        });

        // Check for existing players
        this.checkExistingPlayers();

        this.setupHeartbeat();
    }

    checkExistingPlayers() {
        // Check localStorage for existing players
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('player_')) {
                try {
                    const playerData = JSON.parse(localStorage.getItem(key));
                    if (playerData && playerData.id !== this.currentPlayer) {
                        this.updatePlayer(playerData.id, playerData);
                    }
                } catch (error) {
                    console.error('Error parsing player data:', error);
                }
            }
        }
        this.updateLeaderboard();
    }

    setupGameStartListener() {
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                // Get username from input
                const usernameInput = document.getElementById('usernameInput');
                if (usernameInput) {
                    this.username = usernameInput.value || 'Player';
                }

                // Update player with current stats
                this.updateCurrentPlayer();

                // Show the leaderboard
                const leaderboard = document.getElementById('leaderboard');
                if (leaderboard) {
                    leaderboard.style.display = 'block';
                }

                // Broadcast initial player data
                const playerData = {
                    id: this.currentPlayer,
                    name: this.username || 'Player',
                    level: window.currentLevel || 1,
                    score: window.score || 0,
                    health: window.health || 100
                };
                localStorage.setItem(`player_${this.currentPlayer}`, JSON.stringify(playerData));
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
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
            min-width: 250px;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
            border: 1px solid rgba(0, 255, 0, 0.3);
        `;

        // Add title with online indicator
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 10px 0;
            color: #00ff00;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        title.innerHTML = `
            <span class="online-indicator"></span>
            Live Leaderboard
        `;

        // Add player count
        const playerCount = document.createElement('div');
        playerCount.id = 'player-count';
        playerCount.style.cssText = `
            color: #aaa;
            font-size: 14px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        playerCount.innerHTML = `
            <span class="online-indicator"></span>
            0 Players Online
        `;

        // Add player list
        const playerList = document.createElement('ul');
        playerList.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 300px;
            overflow-y: auto;
        `;
        this.leaderboardElement = playerList;

        // Add styles for online indicator
        const style = document.createElement('style');
        style.textContent = `
            .online-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #00ff00;
                border-radius: 50%;
                box-shadow: 0 0 5px #00ff00;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        container.appendChild(title);
        container.appendChild(playerCount);
        container.appendChild(playerList);
        document.body.appendChild(container);
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
            // Sort players by score and online status
            const sortedPlayers = Array.from(this.players.entries())
                .sort(([, a], [, b]) => {
                    // Online players first
                    if (a.isOnline !== b.isOnline) return b.isOnline ? 1 : -1;
                    // Then by score
                    return b.score - a.score;
                });

            // Update existing elements
            const existingElements = this.leaderboardElement.children;
            sortedPlayers.forEach(([id, player], index) => {
                let playerElement;
                if (index < existingElements.length) {
                    playerElement = existingElements[index];
                } else {
                    playerElement = document.createElement('li');
                    this.leaderboardElement.appendChild(playerElement);
                }

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
                    opacity: ${player.isOnline ? '1' : '0.5'};
                `;

                const playerInfo = document.createElement('div');
                playerInfo.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;

                // Add online indicator
                const onlineIndicator = document.createElement('span');
                onlineIndicator.className = 'online-indicator';
                onlineIndicator.style.opacity = player.isOnline ? '1' : '0.3';

                // Add rank
                const rank = document.createElement('span');
                rank.textContent = `#${index + 1}`;
                rank.style.cssText = `
                    color: ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#00ff00'};
                    font-weight: bold;
                    font-size: 16px;
                    min-width: 30px;
                `;

                // Add player name with online status
                const nameElement = document.createElement('span');
                nameElement.textContent = player.name || 'Player ' + id;
                nameElement.style.cssText = `
                    color: ${id === this.currentPlayer ? '#00ff00' : 'white'};
                    font-weight: ${id === this.currentPlayer ? 'bold' : 'normal'};
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
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

                // Add health bar container
                const healthBarContainer = document.createElement('div');
                healthBarContainer.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    margin-top: 4px;
                `;

                // Add health percentage
                const healthText = document.createElement('span');
                healthText.textContent = `${player.health}%`;
                healthText.style.cssText = `
                    color: ${player.health > 50 ? '#00ff00' : player.health > 25 ? '#ffff00' : '#ff0000'};
                    font-size: 12px;
                    min-width: 40px;
                    text-align: right;
                `;

                // Add health bar
                const healthBar = document.createElement('div');
                healthBar.style.cssText = `
                    width: 60px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                `;

                const healthFill = document.createElement('div');
                healthFill.style.cssText = `
                    width: ${player.health}%;
                    height: 100%;
                    background: ${player.health > 50 ? '#00ff00' : player.health > 25 ? '#ffff00' : '#ff0000'};
                    transition: all 0.3s ease;
                    box-shadow: 0 0 5px ${player.health > 50 ? 'rgba(0, 255, 0, 0.5)' : player.health > 25 ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'};
                `;

                healthBar.appendChild(healthFill);
                healthBarContainer.appendChild(healthText);
                healthBarContainer.appendChild(healthBar);

                statsElement.appendChild(levelBadge);
                statsElement.appendChild(scoreElement);
                statsElement.appendChild(healthBarContainer);

                playerInfo.appendChild(onlineIndicator);
                playerInfo.appendChild(rank);
                playerInfo.appendChild(nameElement);
                playerElement.innerHTML = '';
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
            this.updatePlayer(this.currentPlayer, {
                name: this.username || 'Player',
                level: gameLevel,
                score: gameScore,
                health: gameHealth,
                lastUpdate: Date.now()
            });

            // Broadcast the update
            const playerData = {
                id: this.currentPlayer,
                name: this.username || 'Player',
                level: gameLevel,
                score: gameScore,
                health: gameHealth,
                lastUpdate: Date.now()
            };
            localStorage.setItem(`player_${this.currentPlayer}`, JSON.stringify(playerData));

            // Force a leaderboard update
            this.updateLeaderboard();
        } catch (error) {
            console.error('Error updating current player:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    setupOtherPlayers() {
        // Generate a unique player ID for this instance
        const playerId = `player${Date.now()}`; // Use timestamp for unique ID
        this.currentPlayer = playerId;

        // Add this player to the tracker
        this.updatePlayer(playerId, {
            name: this.username || 'Player',
            level: window.currentLevel || 1,
            score: window.score || 0,
            health: window.health || 100,
            lastUpdate: Date.now()
        });

        // Update the leaderboard
        this.updateLeaderboard();

        // Start the update loop to keep player data current
        this.startUpdateLoop();

        // Broadcast this player's data periodically
        setInterval(() => {
            const playerData = {
                id: this.currentPlayer,
                name: this.username || 'Player',
                level: window.currentLevel || 1,
                score: window.score || 0,
                health: window.health || 100,
                lastUpdate: Date.now()
            };
            localStorage.setItem(`player_${this.currentPlayer}`, JSON.stringify(playerData));
        }, 1000); // Update every second

        // Clean up inactive players
        setInterval(() => {
            const currentTime = Date.now();
            for (const [id, player] of this.players.entries()) {
                if (id !== this.currentPlayer && currentTime - player.lastUpdate > 5000) {
                    this.players.delete(id);
                    localStorage.removeItem(`player_${id}`);
                }
            }
            this.updateLeaderboard();
        }, 5000); // Check every 5 seconds
    }

    setupHeartbeat() {
        // Send heartbeat every 2 seconds
        setInterval(() => {
            this.sendHeartbeat();
        }, this.heartbeatInterval);

        // Check for online status every second
        setInterval(() => {
            this.checkOnlineStatus();
        }, 1000);
    }

    sendHeartbeat() {
        const playerData = {
            id: this.currentPlayer,
            name: this.username || 'Player',
            level: window.currentLevel || 1,
            score: window.score || 0,
            health: window.health || 100,
            lastUpdate: Date.now(),
            isOnline: true
        };
        localStorage.setItem(`player_${this.currentPlayer}`, JSON.stringify(playerData));
    }

    checkOnlineStatus() {
        const currentTime = Date.now();
        let onlineCount = 0;

        // Check all players in localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('player_')) {
                try {
                    const playerData = JSON.parse(localStorage.getItem(key));
                    if (playerData) {
                        const isOnline = currentTime - playerData.lastUpdate < this.onlineTimeout;
                        if (isOnline) {
                            onlineCount++;
                            this.updatePlayer(playerData.id, {
                                ...playerData,
                                isOnline: true
                            });
                        } else {
                            // Remove offline players
                            this.players.delete(playerData.id);
                            localStorage.removeItem(key);
                        }
                    }
                } catch (error) {
                    console.error('Error checking player status:', error);
                }
            }
        }

        // Update online count display
        const playerCount = document.getElementById('player-count');
        if (playerCount) {
            playerCount.innerHTML = `
                <span class="online-indicator"></span>
                ${onlineCount} Players Online
            `;
        }

        this.updateLeaderboard();
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