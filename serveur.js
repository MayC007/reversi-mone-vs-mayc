const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

let players = {};
let boardState = [];

function initializeBoard() {
  boardState = Array(8).fill(null).map(() => Array(8).fill(""));
  boardState[3][3] = "mayc";
  boardState[3][4] = "mone";
  boardState[4][3] = "mone";
  boardState[4][4] = "mayc";
}

initializeBoard();

io.on("connection", (socket) => {
  console.log("Nouvelle connexion :", socket.id);

  socket.on("join", (username) => {
    players[socket.id] = username;
    socket.emit("playerColor", username);
    socket.emit("boardUpdate", boardState);
    console.log(username + " a rejoint la partie.");
  });

  socket.on("play", ({ x, y, player }) => {
    if (boardState[y][x] === "") {
      boardState[y][x] = player;
      io.emit("boardUpdate", boardState);
    }
  });

  socket.on("disconnect", () => {
    console.log("Déconnexion :", socket.id);
    delete players[socket.id];
  });
});

http.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});
