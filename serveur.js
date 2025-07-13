// serveur.js - version complète avec Socket.io

const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Gestion des rooms et des joueurs
const rooms = {};

io.on("connection", (socket) => {
  console.log("Nouveau client connecté :", socket.id);

  socket.on("join", (room) => {
    if (!rooms[room]) {
      rooms[room] = [];
    }

    if (rooms[room].length >= 2) {
      socket.emit("full");
      return;
    }

    rooms[room].push(socket.id);
    socket.join(room);

    const player = rooms[room].length === 1 ? "mone" : "mayc";
    socket.emit("joined", { player });

    if (rooms[room].length === 2) {
      io.to(room).emit("start");
    }
  });

  socket.on("move", ({ room, index, player }) => {
    socket.to(room).emit("move", { index, player });
  });

  socket.on("restart", (room) => {
    io.to(room).emit("restart");
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        rooms[room] = rooms[room]?.filter((id) => id !== socket.id);
        io.to(room).emit("opponent_left");
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Serveur actif sur le port ${port}`);
});
