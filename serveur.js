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
  socket.on("join", ({ room, player }) => {
    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        cells: initializeBoard(),
      };
    }

    if (!rooms[room].players.includes(player)) {
      if (rooms[room].players.length >= 2) {
        socket.emit("full");
        return;
      }
      rooms[room].players.push(player);
    }

    socket.join(room);
    socket.room = room;
    socket.player = player;

    socket.emit("joined", {
      player,
      room,
      cells: rooms[room].cells,
    });
  });

  socket.on("move", ({ room, updatedCells, nextPlayer }) => {
    if (rooms[room]) {
      rooms[room].cells = updatedCells;
      io.to(room).emit("move", {
        updatedCells,
        nextPlayer,
      });
    }
  });

  socket.on("restart", (room) => {
    if (rooms[room]) {
      rooms[room].cells = initializeBoard();
      io.to(room).emit("restart", rooms[room].cells);
    }
  });

  socket.on("disconnect", () => {
    const room = socket.room;
    const player = socket.player;
    if (room && rooms[room]) {
      rooms[room].players = rooms[room].players.filter((p) => p !== player);
      if (rooms[room].players.length === 0) {
        delete rooms[room];
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Serveur actif sur le port ${port}`);
});
