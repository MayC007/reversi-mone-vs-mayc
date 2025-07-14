const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

let parties = {};

io.on('connection', (socket) => {
    console.log('Nouvelle connexion :', socket.id);

    socket.on('rejoindre', ({ roomId, joueur }) => {
        socket.join(roomId);
        if (!parties[roomId]) {
            parties[roomId] = {
                joueurs: {},
                plateau: null
            };
        }
        parties[roomId].joueurs[socket.id] = joueur;

        io.to(roomId).emit('etat', {
            joueur: joueur,
            plateau: parties[roomId].plateau
        });
    });

    socket.on('maj_plateau', ({ roomId, plateau }) => {
        if (parties[roomId]) {
            parties[roomId].plateau = plateau;
            socket.to(roomId).emit('maj_plateau', plateau);
        }
    });

    socket.on('disconnect', () => {
        for (let roomId in parties) {
            delete parties[roomId].joueurs[socket.id];
        }
    });
});

http.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
