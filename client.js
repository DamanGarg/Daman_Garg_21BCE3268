let currentPlayer = 'A'; // Initial player turn

// Sample game state to hold positions and other relevant data
let gameState = {
    players: {
        A: {
            characters: ['P1', 'P2', 'H1', 'H2', 'H3'], // Example characters for Player A
            positions: {
                P1: { x: 0, y: 0 }, // Example position for Pawn 1
                P2: { x: 1, y: 0 }, // Example position for Pawn 2
                H1: { x: 2, y: 0 }, // Example position for Hero1
                H2: { x: 3, y: 0 }, // Example position for Hero2
                H3: { x: 4, y: 0 }  // Example position for Horse
            }
        },
        B: {
            characters: ['P1', 'P2', 'H1', 'H2', 'H3'], // Example characters for Player B
            positions: {
                P1: { x: 0, y: 4 }, // Example position for Pawn 1
                P2: { x: 1, y: 4 }, // Example position for Pawn 2
                H1: { x: 2, y: 4 }, // Example position for Hero1
                H2: { x: 3, y: 4 }, // Example position for Hero2
                H3: { x: 4, y: 4 }  // Example position for Horse
            }
        }
    },
    boardSize: 5 // 5x5 board
};

// Directions moved outside of functions to be globally available
const directions = {
    'L': { x: -1, y: 0 },
    'R': { x: 1, y: 0 },
    'F': { x: 0, y: 1 },
    'B': { x: 0, y: -1 },
    'FL': { x: -1, y: 1 },
    'FR': { x: 1, y: 1 },
    'BL': { x: -1, y: -1 },
    'BR': { x: 1, y: -1 },
    'Horse-L': { x: -1, y: 2 },
    'Horse-R': { x: 1, y: 2 },
    'Horse-BL': { x: -1, y: -2 },
    'Horse-BR': { x: 1, y: -2 },
    'Horse-RF': { x: 2, y: 1 },
    'Horse-RB': { x: 2, y: -1 },
    'Horse-LF': { x: -2, y: 1 },
    'Horse-LB': { x: -2, y: -1 }
};

// Function to switch turns between Player A and Player B
function switchTurn() {
    currentPlayer = currentPlayer === 'A' ? 'B' : 'A';
    updateTurnDisplay();
}

// Function to update the displayed current player's turn
function updateTurnDisplay() {
    const turnDisplay = document.getElementById('turn-display');
    turnDisplay.textContent = `Current Turn: Player ${currentPlayer}`;
}

// Function to update move history
function updateMoveHistory(player, move) {
    const historyDiv = document.getElementById(`history-${player}`);
    const moveItem = document.createElement('div');
    moveItem.textContent = move;
    historyDiv.appendChild(moveItem);
}

// Function to check if a player has won
function checkWinner() {
    const playerACharacters = Object.keys(gameState.players.A.positions).length;
    const playerBCharacters = Object.keys(gameState.players.B.positions).length;

    if (playerACharacters === 0) {
        displayWinnerMessage('B');
    } else if (playerBCharacters === 0) {
        displayWinnerMessage('A');
    }
}

// Function to display winner message
function displayWinnerMessage(winner) {
    const winnerDisplay = document.getElementById('winner-display');
    winnerDisplay.textContent = `Player ${winner} Wins!`;
}

// Function to process a move
function processMove(move) {
    const [charName, direction] = move.split(':');

    if (!gameState.players[currentPlayer].characters.includes(charName)) {
        alert("Invalid move: Character doesn't exist or not your turn.");
        return false;
    }

    const currentPos = gameState.players[currentPlayer].positions[charName];
    let newPos = { x: currentPos.x, y: currentPos.y };

    const dir = directions[direction];
    if (!dir) {
        alert("Invalid move: Unsupported move direction.");
        return false;
    }

    if (charName.startsWith('H1') || charName.startsWith('H2')) {
        newPos = {
            x: currentPos.x + 2 * dir.x,
            y: currentPos.y + 2 * dir.y
        };
    } else if (charName.startsWith('H3')) {
        // Hero3 move (2 forward, 1 left or right)
        newPos = {
            x: currentPos.x + dir.x,
            y: currentPos.y + 2 * dir.y
        };
    } else {
        newPos = {
            x: currentPos.x + dir.x,
            y: currentPos.y + dir.y
        };
    }

    if (newPos.x < 0 || newPos.x >= gameState.boardSize || newPos.y < 0 || newPos.y >= gameState.boardSize) {
        alert("Invalid move: Out of board boundaries.");
        return false;
    }

    const opponent = currentPlayer === 'A' ? 'B' : 'A';
    const opponentPositions = gameState.players[opponent].positions;
    for (const [key, pos] of Object.entries(opponentPositions)) {
        if (pos.x === newPos.x && pos.y === newPos.y) {
            delete opponentPositions[key];
            alert(`${key} of Player ${opponent} has been defeated!`);
            break;
        }
    }

    if (charName.startsWith('H')) {
        const isFriendlyPiece = Object.values(gameState.players[currentPlayer].positions).some(
            pos => pos.x === newPos.x && pos.y === newPos.y
        );
        if (isFriendlyPiece) {
            alert("Invalid move: Move blocked by friendly piece.");
            return false;
        }
    }

    gameState.players[currentPlayer].positions[charName] = newPos;
    updateMoveHistory(currentPlayer, `${charName} moved ${direction}`);
    refreshBoardView();
    checkWinner();

    return true;
}

// Function to handle making a move (called when the "Make Move" button is clicked)
function makeMove(move) {
    if (processMove(move)) {
        switchTurn(); // Only switch turn if the move is valid
    }
}

// Function to refresh the game board view
function refreshBoardView() {
    const boardDiv = document.getElementById('game-board');
    boardDiv.innerHTML = ''; // Clear current board

    for (let y = gameState.boardSize - 1; y >= 0; y--) {
        for (let x = 0; x < gameState.boardSize; x++) {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            cellDiv.dataset.x = x;
            cellDiv.dataset.y = y;

            const character = findCharacterAtPosition(x, y);
            if (character) {
                cellDiv.textContent = character;
                cellDiv.classList.add('occupied');
                cellDiv.dataset.character = character.split('-')[1]; // Save character name
                cellDiv.onclick = handleCellClick; // Assign click handler only to occupied cells
            }
            boardDiv.appendChild(cellDiv);
        }
    }
}

// Helper function to find character at a specific position
function findCharacterAtPosition(x, y) {
    for (const player of ['A', 'B']) {
        for (const [charName, pos] of Object.entries(gameState.players[player].positions)) {
            if (pos.x === x && pos.y === y) {
                return `${player}-${charName}`;
            }
        }
    }
    return null;
}

// Show possible move options for the selected character
function showMoveOptions(moves) {
    const optionsDiv = document.getElementById('move-options');
    optionsDiv.innerHTML = ''; // Clear previous options

    moves.forEach(move => {
        const button = document.createElement('button');
        button.textContent = `Move ${move.move}`;
        button.onclick = () => {
            const moveCommand = `${move.character}:${move.move}`;
            makeMove(moveCommand);
        };
        optionsDiv.appendChild(button);
    });
}

// Handle cell click to show possible moves
function handleCellClick(event) {
    const cell = event.target;
    const charName = cell.dataset.character;

    if (charName && gameState.players[currentPlayer].characters.includes(charName)) {
        const charPos = gameState.players[currentPlayer].positions[charName];
        const possibleMoves = getPossibleMoves(charName, charPos);

        if (possibleMoves.length > 0) {
            showMoveOptions(possibleMoves);
        } else {
            alert("No possible moves.");
        }
    } else {
        alert("Invalid turn: It's Player " + currentPlayer + "'s turn.");
    }
}

// Get possible moves based on the character type and current position
function getPossibleMoves(character, position) {
    const possibleMoves = [];
    const dirList = character.startsWith('H1') || character.startsWith('H2')
        ? ['L', 'R', 'F', 'B']
        : character.startsWith('H3')
            ? ['Horse-L', 'Horse-R', 'Horse-BL', 'Horse-BR', 'Horse-RF', 'Horse-RB', 'Horse-LF', 'Horse-LB']
            : ['L', 'R', 'F', 'B'];

    dirList.forEach(dir => {
        const moveDir = directions[dir];
        const multiplier = character.startsWith('H') ? 2 : 1; // Double move for Hero, single for Pawn and Horse
        const newPos = {
            x: position.x + moveDir.x * multiplier,
            y: position.y + moveDir.y * multiplier
        };

        if (newPos.x >= 0 && newPos.x < gameState.boardSize && newPos.y >= 0 && newPos.y < gameState.boardSize) {
            const isFriendlyPiece = Object.values(gameState.players[currentPlayer].positions).some(
                pos => pos.x === newPos.x && pos.y === newPos.y
            );

            const isEnemyPiece = Object.values(gameState.players[currentPlayer === 'A' ? 'B' : 'A'].positions).some(
                pos => pos.x === newPos.x && pos.y === newPos.y
            );

            if (!isFriendlyPiece || isEnemyPiece) {
                possibleMoves.push({ move: dir, character });
            }
        }
    });

    return possibleMoves;
}

// Initialize the game board
function initializeBoard() {
    const gameBoardDiv = document.createElement('div');
    gameBoardDiv.id = 'game-board';
    gameBoardDiv.style.display = 'grid';
    gameBoardDiv.style.gridTemplateColumns = `repeat(${gameState.boardSize}, 50px)`;
    gameBoardDiv.style.gridTemplateRows = `repeat(${gameState.boardSize}, 50px)`;
    document.body.appendChild(gameBoardDiv);

    const turnDisplay = document.createElement('div');
    turnDisplay.id = 'turn-display';
    document.body.appendChild(turnDisplay);

    const winnerDisplay = document.createElement('div');
    winnerDisplay.id = 'winner-display';
    document.body.appendChild(winnerDisplay);

    const moveOptionsDiv = document.createElement('div');
    moveOptionsDiv.id = 'move-options';
    document.body.appendChild(moveOptionsDiv);

    const playerHistory = document.createElement('div');
    playerHistory.id = 'history-A';
    document.body.appendChild(playerHistory);

    const playerBHistory = document.createElement('div');
    playerBHistory.id = 'history-B';
    document.body.appendChild(playerBHistory);

    refreshBoardView();
    updateTurnDisplay();
}

// Call initializeBoard when the page is loaded
window.onload = initializeBoard;
