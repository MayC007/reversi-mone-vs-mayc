
const express = require("express");
const path = require("path");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let games = {};

function createInitialBoard() {
    const size = 8;
    const board = Array(size).fill(null).map(() => Array(size).fill(null));
    const mid = size / 2;
    board[mid - 1][mid - 1] = "May.C";
    board[mid][mid] = "May.C";
    board[mid - 1][mid] = "Mone";
    board[mid][mid - 1] = "Mone";
    return board;
}

function getScore(board) {
    let score = { "Mone": 0, "May.C": 0 };
    for (let row of board) {
        for (let cell of row) {
            if (cell === "Mone") score["Mone"]++;
            if (cell === "May.C") score["May.C"]++;
        }
    }
    return score;
}

io.on("connection", (socket) => {
    socket.on("rejoindre", ({ room, joueur }) => {
        socket.join(room);
        if (!games[room]) {
            games[room] = {
                board: createInitialBoard(),
                joueurActif: "Mone",
                score: { "Mone": 2, "May.C": 2 }
            };
        }
        socket.emit("etatJeu", games[room]);
    });

    socket.on("jouer", ({ room, x, y, joueur }) => {
        let game = games[room];
        if (!game || game.joueurActif !== joueur) return;

        let board = game.board;
        if (board[y][x]) return;

        let directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
            [1, 1], [-1, -1], [1, -1], [-1, 1]
        ];

        let adversaire = joueur === "Mone" ? "May.C" : "Mone";
        let validMove = false;

        for (let [dx, dy] of directions) {
            let nx = x + dx, ny = y + dy;
            let toFlip = [];

            while (
                ny >= 0 && ny < 8 &&
                nx >= 0 && nx < 8 &&
                board[ny][nx] === adversaire
            ) {
                toFlip.push([nx, ny]);
                nx += dx;
                ny += dy;
            }

            if (
                toFlip.length > 0 &&
                ny >= 0 && ny < 8 &&
                nx >= 0 && nx < 8 &&
                board[ny][nx] === joueur
            ) {
                for (let [fx, fy] of toFlip) {
                    board[fy][fx] = joueur;
                }
                validMove = true;
            }
        }

        if (validMove) {
            board[y][x] = joueur;
            game.joueurActif = adversaire;
            game.score = getScore(board);
            io.to(room).emit("etatJeu", game);
        }
    });

    socket.on("reset", (room) => {
        games[room] = {
            board: createInitialBoard(),
            joueurActif: "Mone",
            score: { "Mone": 2, "May.C": 2 }
        };
        io.to(room).emit("etatJeu", games[room]);
    });
});

http.listen(process.env.PORT || 3000, () => {
    console.log("Serveur en écoute");
});
