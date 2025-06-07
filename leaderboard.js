class LeaderboardSystem {
    constructor() {
        this.leaderboard = [];
        this.maxEntries = 3;
        this.medals = {
            1: '🥇', // Gold medal
            2: '🥈', // Silver medal
            3: '🥉'  // Bronze medal
        };
        this.serverUrl = 'https://your-server-endpoint.com/leaderboard'; // Replace with your actual server endpoint
        this.loadLeaderboard();
        this.setupLeaderboardUI();
        this.setupPopup();

        // Add test data if leaderboard is empty
        if (this.leaderboard.length === 0) {
            this.addTestData();
        }
    }

    addTestData() {
        const testData = [
            {
                username: "Player1",
                level: 1,
                score: 1700,
                health: 100,
                enemiesDefeated: 15,
                timePlayed: "10:30",
                date: new Date().toISOString()
            },
            // {
            //     username: "Player2",
            //     level: 8,
            //     score: 3500,
            //     health: 80,
            //     enemiesDefeated: 35,
            //     timePlayed: "08:15",
            //     date: new Date().toISOString()
            // },
            // {
            //     username: "Player3",
            //     level: 5,
            //     score: 2000,
            //     health: 60,
            //     enemiesDefeated: 20,
            //     timePlayed: "05:45",
            //     date: new Date().toISOString()
            // }
        ];

        this.leaderboard = testData;
        this.saveLeaderboard();
        this.updateLeaderboardUI();
        this.updatePopupContent();
    }

    setupLeaderboardUI() {
        // Create leaderboard container
        const leaderboardContainer = document.createElement('div');
        leaderboardContainer.id = 'leaderboardContainer';
        leaderboardContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
            max-width: 274px;
            width: 100%;
            border: 1px solid rgba(0, 255, 0, 0.3);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        `;

        // Add hover effect
        leaderboardContainer.addEventListener('mouseover', () => {
            leaderboardContainer.style.transform = 'scale(1.02)';
            leaderboardContainer.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
        });

        leaderboardContainer.addEventListener('mouseout', () => {
            leaderboardContainer.style.transform = 'scale(1)';
            leaderboardContainer.style.boxShadow = 'none';
        });

        // Create title
        const title = document.createElement('h2');
        title.textContent = '🏆 Top Players';
        title.style.cssText = `
            margin: 0 0 10px 0;
            text-align: center;
            color: #ffd700;
            font-size: 1.2em;
        `;
        leaderboardContainer.appendChild(title);

        // Create leaderboard list
        const leaderboardList = document.createElement('ul');
        leaderboardList.id = 'leaderboardList';
        leaderboardList.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
        `;
        leaderboardContainer.appendChild(leaderboardList);

        // Add to game container
        document.body.appendChild(leaderboardContainer);

        // Add click event to show popup
        leaderboardContainer.addEventListener('click', () => {
            this.togglePopup();
        });
    }

    setupPopup() {
        // Create popup container
        const popup = document.createElement('div');
        popup.id = 'leaderboardPopup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            padding: 20px;
            border-radius: 15px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 2000;
            min-width: 300px;
            max-width: 800px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            display: none;
            border: 2px solid rgba(0, 255, 0, 0.3);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
        `;

        // Create popup header
        const popupHeader = document.createElement('div');
        popupHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const popupTitle = document.createElement('h2');
        popupTitle.textContent = '🏆 Global Leaderboard';
        popupTitle.style.cssText = `
            margin: 0;
            color: #ffd700;
            font-size: 1.5em;
        `;

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0 10px;
            transition: color 0.2s;
        `;
        closeButton.addEventListener('mouseover', () => {
            closeButton.style.color = '#ff4444';
        });
        closeButton.addEventListener('mouseout', () => {
            closeButton.style.color = 'white';
        });
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePopup();
        });

        popupHeader.appendChild(popupTitle);
        popupHeader.appendChild(closeButton);
        popup.appendChild(popupHeader);

        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.id = 'popupLeaderboardList';
        popupContent.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
        `;
        popup.appendChild(popupContent);

        // Add to body
        document.body.appendChild(popup);

        // Add overlay
        const overlay = document.createElement('div');
        overlay.id = 'leaderboardOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1999;
            display: none;
        `;
        overlay.addEventListener('click', () => {
            this.togglePopup();
        });
        document.body.appendChild(overlay);
    }

    togglePopup() {
        const popup = document.getElementById('leaderboardPopup');
        const overlay = document.getElementById('leaderboardOverlay');
        const isVisible = popup.style.display === 'block';

        if (isVisible) {
            popup.style.display = 'none';
            overlay.style.display = 'none';
        } else {
            popup.style.display = 'block';
            overlay.style.display = 'block';
            this.updatePopupContent();
        }
    }

    updatePopupContent() {
        const popupList = document.getElementById('popupLeaderboardList');
        if (!popupList) {
            console.error('Popup list element not found');
            return;
        }

        popupList.innerHTML = '';
        console.log('Updating popup with leaderboard:', this.leaderboard);

        this.leaderboard.forEach((entry, index) => {
            const rank = index + 1;
            const medal = this.medals[rank] || '';

            const listItem = document.createElement('div');
            listItem.style.cssText = `
                padding: 15px;
                margin: 10px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                transition: transform 0.2s;
            `;

            // Player header with rank and name
            const playerHeader = document.createElement('div');
            playerHeader.style.cssText = `
                display: flex;
                align-items: center;
                gap: 15px;
                font-size: 1.2em;
            `;

            const rankElement = document.createElement('span');
            rankElement.textContent = `${medal} `;
            rankElement.style.fontSize = '1.5em';

            const nameElement = document.createElement('span');
            nameElement.textContent = entry.username;
            nameElement.style.fontWeight = 'bold';

            playerHeader.appendChild(rankElement);
            playerHeader.appendChild(nameElement);

            // Player stats
            const statsContainer = document.createElement('div');
            statsContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 5px;
            `;

            const stats = [
                { label: 'Score', value: entry.score, color: '#ffd700' },
                { label: 'Level', value: entry.level, color: '#00ff00' },
                { label: 'Health', value: entry.health, color: '#ff4444' },
                { label: 'Enemies Defeated', value: entry.enemiesDefeated || 0, color: '#ff8800' }
            ];

            stats.forEach(stat => {
                const statElement = document.createElement('div');
                statElement.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                `;

                const label = document.createElement('span');
                label.textContent = stat.label;
                label.style.cssText = `
                    font-size: 0.8em;
                    color: rgba(255, 255, 255, 0.7);
                `;

                const value = document.createElement('span');
                value.textContent = stat.value;
                value.style.cssText = `
                    font-size: 1.1em;
                    color: ${stat.color};
                    font-weight: bold;
                `;

                statElement.appendChild(label);
                statElement.appendChild(value);
                statsContainer.appendChild(statElement);
            });

            // Date achieved
            const dateElement = document.createElement('div');
            dateElement.style.cssText = `
                font-size: 0.8em;
                color: rgba(255, 255, 255, 0.5);
                text-align: right;
                margin-top: 5px;
            `;
            const date = new Date(entry.date);
            dateElement.textContent = `Achieved on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;

            // Add all elements to list item
            listItem.appendChild(playerHeader);
            listItem.appendChild(statsContainer);
            listItem.appendChild(dateElement);

            if (this.isNewEntry(entry)) {
                listItem.style.animation = 'highlight 2s ease-out';
            }

            popupList.appendChild(listItem);
        });
    }

    async loadLeaderboard() {
        try {
            // First try to load from server
            const response = await fetch(this.serverUrl);
            if (response.ok) {
                const data = await response.json();
                this.leaderboard = data;
                console.log('Loaded leaderboard from server:', this.leaderboard);
            } else {
                // Fallback to localStorage if server request fails
                const savedLeaderboard = localStorage.getItem('gameLeaderboard');
                if (savedLeaderboard) {
                    this.leaderboard = JSON.parse(savedLeaderboard);
                    console.log('Loaded leaderboard from localStorage:', this.leaderboard);
                }
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            // Fallback to localStorage
            const savedLeaderboard = localStorage.getItem('gameLeaderboard');
            if (savedLeaderboard) {
                this.leaderboard = JSON.parse(savedLeaderboard);
            }
        }
        this.updateLeaderboardUI();
        this.updatePopupContent();
    }

    async saveLeaderboard() {
        try {
            // Save to server
            const response = await fetch(this.serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.leaderboard)
            });

            if (!response.ok) {
                throw new Error('Failed to save to server');
            }

            // Also save to localStorage as backup
            localStorage.setItem('gameLeaderboard', JSON.stringify(this.leaderboard));
            console.log('Saved leaderboard to server and localStorage:', this.leaderboard);
        } catch (error) {
            console.error('Error saving leaderboard:', error);
            // Fallback to localStorage only
            localStorage.setItem('gameLeaderboard', JSON.stringify(this.leaderboard));
        }
    }

    async updateLeaderboard(playerData) {
        console.log('Updating leaderboard with:', playerData);

        // Add new score with additional data
        const newEntry = {
            username: playerData.username || 'Unknown Player',
            level: playerData.level || 1,
            score: playerData.score || 0,
            health: playerData.health || 100,
            enemiesDefeated: playerData.enemiesDefeated || 0,
            timePlayed: playerData.timePlayed || '00:00',
            date: new Date().toISOString()
        };

        this.leaderboard.push(newEntry);

        // Sort by score (highest first)
        this.leaderboard.sort((a, b) => b.score - a.score);

        // Keep only top 3
        this.leaderboard = this.leaderboard.slice(0, this.maxEntries);

        // Save to server and localStorage
        await this.saveLeaderboard();

        // Update UI
        this.updateLeaderboardUI();
        this.updatePopupContent();
    }

    updateLeaderboardUI() {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';

        this.leaderboard.forEach((entry, index) => {
            const rank = index + 1;
            const medal = this.medals[rank] || '';

            const listItem = document.createElement('li');
            listItem.style.cssText = `
                padding: 8px;
                margin: 5px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;

            const playerInfo = document.createElement('div');
            playerInfo.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
            `;

            const rankElement = document.createElement('span');
            rankElement.textContent = `${medal} `;
            rankElement.style.fontSize = '1.2em';

            const nameElement = document.createElement('span');
            nameElement.textContent = entry.username;
            nameElement.style.fontWeight = 'bold';

            const scoreElement = document.createElement('span');
            scoreElement.textContent = `Level ${entry.level} - ${entry.score} pts`;
            scoreElement.style.color = '#ffd700';

            playerInfo.appendChild(rankElement);
            playerInfo.appendChild(nameElement);
            listItem.appendChild(playerInfo);
            listItem.appendChild(scoreElement);

            // Add highlight animation for new entries
            if (this.isNewEntry(entry)) {
                listItem.style.animation = 'highlight 2s ease-out';
            }

            leaderboardList.appendChild(listItem);
        });
    }

    isNewEntry(entry) {
        // Check if this entry was added in the last 5 seconds
        const entryTime = new Date(entry.date).getTime();
        const currentTime = new Date().getTime();
        return (currentTime - entryTime) < 5000;
    }

    // Add highlight animation style
    addHighlightStyle() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes highlight {
                0% { background: rgba(255, 215, 0, 0.3); }
                100% { background: rgba(255, 255, 255, 0.1); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize leaderboard system
const leaderboardSystem = new LeaderboardSystem();
leaderboardSystem.addHighlightStyle();

// Export for use in game.js
window.leaderboardSystem = leaderboardSystem; 