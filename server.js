const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

let gameState = {
    players: {
        A: {
            characters: ['P1', 'P2', 'H1', 'H2', 'H3'],
            positions: {
                P1: { x: 0, y: 0 },
                P2: { x: 1, y: 0 },
                H1: { x: 2, y: 0 },
                H2: { x: 3, y: 0 },
                H3: { x: 4, y: 0 }
            }
        },
        B: {
            characters: ['P1', 'P2', 'H1', 'H2', 'H3'],
            positions: {
                P1: { x: 0, y: 4 },
                P2: { x: 1, y: 4 },
                H1: { x: 2, y: 4 },
                H2: { x: 3, y: 4 },
                H3: { x: 4, y: 4 }
            }
        }
    },
    boardSize: 5
};

wss.on('connection', ws => {
    console.log('New client connected');

    ws.on('message', message => {
        console.log(`Received message => ${message}`);
        const { type, data } = JSON.parse(message);

        if (type === 'MOVE') {
            const { character, direction } = data;
            const result = processMove(character, direction);
            if (result) {
                broadcast(JSON.stringify({ type: 'UPDATE', gameState }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function processMove(character, direction) {
    // Simplified move processing logic
    const [player, charName] = character.split('-');
    const currentPos = gameState.players[player].positions[charName];
    const directions = {
        'L': { x: -1, y: 0 },
        'R': { x: 1, y: 0 },
        'F': player === 'A' ? { x: 0, y: 1 } : { x: 0, y: -1 },
        'B': player === 'A' ? { x: 0, y: -1 } : { x: 0, y: 1 },
        'FL': player === 'A' ? { x: -1, y: 1 } : { x: -1, y: -1 },
        'FR': player === 'A' ? { x: 1, y: 1 } : { x: 1, y: -1 },
        'BL': player === 'A' ? { x: -1, y: -1 } : { x: -1, y: 1 },
        'BR': player === 'A' ? { x: 1, y: -1 } : { x: 1, y: 1 }
    };

    const dir = directions[direction];
    if (!dir) {
        return false;
    }

    const newPos = {
        x: currentPos.x + dir.x,
        y: currentPos.y + dir.y
    };

    if (newPos.x < 0 || newPos.x >= gameState.boardSize || newPos.y < 0 || newPos.y >= gameState.boardSize) {
        return false;
    }

    const opponent = player === 'A' ? 'B' : 'A';
    const opponentPositions = gameState.players[opponent].positions;
    for (const [key, pos] of Object.entries(opponentPositions)) {
        if (pos.x === newPos.x && pos.y === newPos.y) {
            delete opponentPositions[key];
            break;
        }
    }

    gameState.players[player].positions[charName] = newPos;
    return true;
}

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
