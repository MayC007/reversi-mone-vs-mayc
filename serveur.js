const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Initialisation
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Render fournit le port via une variable d'environnement
const PORT = process.env.PORT || 3000;

// Sert les fichiers statiques dans le dossier "public"
app.use(express.static('public'));

// Données des parties
const parties = {};  // { nomPartie: { joueurs: [], plateau: [...], tour: "" } }

io.on('connection', (socket) => {
  console.log('✅ Un joueur s\'est connecté');

  socket.on('rejoindrePartie', ({ nom, joueur }) => {
    socket.join(nom);
    if (!parties[nom]) {
      parties[nom] = {
        joueurs: [joueur],
        plateau: Array(8).fill(null).map(() => Array(8).fill('')),
        tour: joueur,
        score: { Mone: 2, MayC: 2 },
        historique: []
      };
      // Initialisation du centre
      const p = parties[nom].plateau;
      p[3][3] = 'MayC';
      p[3][4] = 'Mone';
      p[4][3] = 'Mone';
      p[4][4] = 'MayC';
    } else {
      if (!parties[nom].joueurs.includes(joueur)) {
        parties[nom].joueurs.push(joueur);
      }
    }

    // Envoyer l’état actuel au nouveau joueur
    io.to(nom).emit('majPartie', parties[nom]);
  });

  socket.on('jouerCoup', ({ nom, x, y, joueur }) => {
    const partie = parties[nom];
    if (!partie || partie.tour !== joueur) return;

    const p = partie.plateau;
    if (p[x][y] !== '') return;

    const adversaire = joueur === 'Mone' ? 'MayC' : 'Mone';
    let valid = false;
    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0],
      [1, 1], [-1, -1], [1, -1], [-1, 1]
    ];

    const retournés = [];

    directions.forEach(([dx, dy]) => {
      let i = x + dx;
      let j = y + dy;
      const temp = [];

      while (i >= 0 && j >= 0 && i < 8 && j < 8 && p[i][j] === adversaire) {
        temp.push([i, j]);
        i += dx;
        j += dy;
      }

      if (i >= 0 && j >= 0 && i < 8 && j < 8 && p[i][j] === joueur && temp.length) {
        retournés.push(...temp);
      }
    });

    if (retournés.length) {
      p[x][y] = joueur;
      retournés.forEach(([i, j]) => {
        p[i][j] = joueur;
      });
      partie.historique.push(JSON.parse(JSON.stringify(p)));
      partie.tour = adversaire;

      // Recalcul du score
      let scoreMone = 0;
      let scoreMayC = 0;
      p.flat().forEach(cell => {
        if (cell === 'Mone') scoreMone++;
        if (cell === 'MayC') scoreMayC++;
      });
      partie.score = { Mone: scoreMone, MayC: scoreMayC };

      io.to(nom).emit('majPartie', partie);
    }
  });

  socket.on('resetPartie', (nom) => {
    delete parties[nom];
    io.to(nom).emit('reset');
  });
});

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur en écoute sur le port ${PORT}`);
});
