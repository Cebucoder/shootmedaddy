const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static('.'));

// Store active players
const activePlayers = new Map();

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Handle player joining
    socket.on('playerJoin', (playerData) => {
        activePlayers.set(socket.id, {
            ...playerData,
            lastUpdate: Date.now()
        });

        // Broadcast updated player list to all clients
        io.emit('playerListUpdate', Array.from(activePlayers.values()));
    });

    // Handle player updates
    socket.on('playerUpdate', (playerData) => {
        if (activePlayers.has(socket.id)) {
            activePlayers.set(socket.id, {
                ...playerData,
                lastUpdate: Date.now()
            });

            // Broadcast updated player list to all clients
            io.emit('playerListUpdate', Array.from(activePlayers.values()));
        }
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        activePlayers.delete(socket.id);

        // Broadcast updated player list to all clients
        io.emit('playerListUpdate', Array.from(activePlayers.values()));
    });
});

// Clean up inactive players every 5 seconds
setInterval(() => {
    const now = Date.now();
    for (const [id, player] of activePlayers.entries()) {
        if (now - player.lastUpdate > 5000) {
            activePlayers.delete(id);
            io.emit('playerListUpdate', Array.from(activePlayers.values()));
        }
    }
}, 5000);

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 