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

io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté");

  socket.on("join", (room) => {
    if (!rooms[room]) rooms[room] = [];

    if (rooms[room].length < 2) {
      rooms[room].push(socket.id);
      socket.join(room);

      const playerType = rooms[room].length === 1 ? "mone" : "mayc";
      socket.emit("player", playerType);

      if (rooms[room].length === 2) {
        io.to(room).emit("start");
      }
    } else {
      socket.emit("full");
    }
  });

  socket.on("move", ({ room, cell, player }) => {
    socket.to(room).emit("move", { cell, player });
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (rooms[room]) {
        rooms[room] = rooms[room].filter((id) => id !== socket.id);
        io.to(room).emit("left");
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Serveur actif sur le port ${port}`);
});
