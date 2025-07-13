// serveur.js - Serveur WebSocket et Express pour Reversi

const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let rooms = {};

function initializeBoard() {
  const cells = Array(64).fill(null);
  cells[27] = "mayc";
  cells[28] = "mone";
  cells[35] = "mone";
  cells[36] = "mayc";
  return cells;
}

io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté");

  socket.on("join", (room) => {
    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        cells: initializeBoard()
      };
    }

    if (rooms[room].players.length < 2) {
      rooms[room].players.push(socket.id);
      socket.join(room);

      socket.emit("start", rooms[room].cells);
    } else {
      socket.emit("full");
    }
  });

  socket.on("move", ({ room, cell, player }) => {
    if (!rooms[room]) return;
    rooms[room].cells[cell] = player;
    io.to(room).emit("move", { cell, player, updatedCells: rooms[room].cells });
  });

  socket.on("restart", (room) => {
    if (rooms[room]) {
      rooms[room].cells = initializeBoard();
      io.to(room).emit("restart", rooms[room].cells);
    }
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (rooms[room]) {
        rooms[room].players = rooms[room].players.filter((id) => id !== socket.id);
        if (rooms[room].players.length === 0) {
          delete rooms[room];
        }
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Serveur actif sur le port ${port}`);
});
