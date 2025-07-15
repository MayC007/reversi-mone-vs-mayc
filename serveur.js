const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

let games = {};

io.on('connection', (socket) => {
    socket.on('joinGame', ({ room, player }) => {
        socket.join(room);
        if (!games[room]) {
            games[room] = {
                board: Array(8).fill(null).map(() => Array(8).fill(null)),
                players: [],
                currentPlayer: 'Mone',
                scores: { Mone: 2, MayC: 2 }
            };
            const mid = 4;
            games[room].board[mid - 1][mid - 1] = 'MayC';
            games[room].board[mid][mid] = 'MayC';
            games[room].board[mid - 1][mid] = 'Mone';
            games[room].board[mid][mid - 1] = 'Mone';
        }

        if (!games[room].players.includes(player)) {
            games[room].players.push(player);
        }

        io.to(room).emit('update', games[room]);
    });

    socket.on('play', ({ room, row, col, player }) => {
        const game = games[room];
        if (!game || game.currentPlayer !== player || game.board[row][col]) return;

        const opponent = player === 'Mone' ? 'MayC' : 'Mone';
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1],  [1, 0], [1, 1]
        ];

        let validMove = false;

        for (const [dx, dy] of directions) {
            let r = row + dx, c = col + dy;
            let toFlip = [];

            while (r >= 0 && r < 8 && c >= 0 && c < 8 && game.board[r][c] === opponent) {
                toFlip.push([r, c]);
                r += dx;
                c += dy;
            }

            if (toFlip.length && r >= 0 && r < 8 && c >= 0 && c < 8 && game.board[r][c] === player) {
                validMove = true;
                toFlip.forEach(([fr, fc]) => game.board[fr][fc] = player);
            }
        }

        if (validMove) {
            game.board[row][col] = player;
            game.currentPlayer = opponent;
            game.scores = { Mone: 0, MayC: 0 };
            game.board.forEach(row => row.forEach(cell => {
                if (cell === 'Mone') game.scores.Mone++;
                if (cell === 'MayC') game.scores.MayC++;
            }));
            io.to(room).emit('update', game);
        }
    });

    socket.on('reset', (room) => {
        delete games[room];
        io.to(room).emit('reset');
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log('Server running...');
});
