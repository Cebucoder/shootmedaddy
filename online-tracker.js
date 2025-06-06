// Online player tracking system
class OnlineTracker {
    constructor() {
        this.players = new Map();
        this.currentPlayer = 'player1'; // Set default current player
        this.leaderboardElement = null;
        this.lastUpdate = Date.now();
        this.updateInterval = 120000; // 2 minutes in milliseconds
        this.initializeUI();
        this.setupRealtimeTracking();
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

        // Update player count
        const playerCount = document.getElementById('player-count');
        if (playerCount) {
            playerCount.textContent = `${this.players.size} Players`;
        }

        // Sort players by score
        const sortedPlayers = Array.from(this.players.entries())
            .sort(([, a], [, b]) => b.score - a.score);

        // Create new elements
        const newElements = sortedPlayers.map(([id, player], index) => {
            const playerElement = document.createElement('li');
            playerElement.style.cssText = `
                padding: 12px;
                margin: 5px 0;
                border-radius: 10px;
                background: ${id === this.currentPlayer ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s ease;
                opacity: 0;
                transform: translateY(10px);
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

            playerInfo.appendChild(rank);
            playerInfo.appendChild(nameElement);
            statsElement.appendChild(levelBadge);
            statsElement.appendChild(scoreElement);
            playerElement.appendChild(playerInfo);
            playerElement.appendChild(statsElement);

            return playerElement;
        });

        // Clear current leaderboard
        this.leaderboardElement.innerHTML = '';

        // Add new elements with staggered animation
        newElements.forEach((element, index) => {
            this.leaderboardElement.appendChild(element);
            // Trigger animation
            requestAnimationFrame(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
        });
    }

    setCurrentPlayer(playerId) {
        this.currentPlayer = playerId;
        this.updateLeaderboard();
    }

    setupRealtimeTracking() {
        // Create a MutationObserver to watch for changes in score and health elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    this.updateCurrentPlayer();
                }
            });
        });

        // Start observing the score and health elements
        const scoreElement = document.getElementById('score');
        const healthElement = document.getElementById('health');

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
    }

    updateCurrentPlayer() {
        // Directly access game variables
        const gameScore = window.score || 0;
        const gameLevel = window.currentLevel || 1;
        const gameHealth = window.player?.health || 100;

        this.updatePlayer('player1', {
            name: 'You',
            level: gameLevel,
            score: gameScore,
            health: gameHealth
        });
    }
}

// Create global tracker instance
const onlineTracker = new OnlineTracker();

// Update the leaderboard every 2 minutes
setInterval(() => {
    onlineTracker.updateCurrentPlayer();
}, 120000);

// Export the tracker for use in other files
window.onlineTracker = onlineTracker; 