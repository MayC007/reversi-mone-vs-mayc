const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const rooms = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Un joueur s\'est connecté.');

  socket.on('join', (room) => {
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        cells: Array(64).fill(null),
      };
    }

    const playerRoom = rooms[room];

    if (playerRoom.players.length >= 2) {
      socket.emit('full');
      return;
    }

    playerRoom.players.push(socket.id);
    io.to(room).emit('start', playerRoom.cells);
  });

  socket.on('move', ({ room, cell, player }) => {
    if (rooms[room]) {
      rooms[room].cells[cell] = player;
      io.to(room).emit('move', {
        cell,
        player,
        updatedCells: rooms[room].cells
      });
    }
  });

  socket.on('restart', (room) => {
    if (rooms[room]) {
      rooms[room].cells = Array(64).fill(null);
      io.to(room).emit('restart', rooms[room].cells);
    }
  });

  socket.on('disconnect', () => {
    console.log('Un joueur s\'est déconnecté.');
    for (const room in rooms) {
      const index = rooms[room].players.indexOf(socket.id);
      if (index !== -1) {
        rooms[room].players.splice(index, 1);
        if (rooms[room].players.length === 0) {
          delete rooms[room];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
