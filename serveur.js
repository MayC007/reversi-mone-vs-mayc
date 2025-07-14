const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

const parties = {};

io.on('connection', (socket) => {
    socket.on('rejoindre', ({ partie, joueur }) => {
        socket.join(partie);
        if (!parties[partie]) {
            parties[partie] = {
                plateau: initPlateau(),
                joueurs: {},
                tour: 'Mone',
            };
        }

        parties[partie].joueurs[socket.id] = joueur;

        // Envoyer l’état du plateau et joueur
        io.to(partie).emit('maj', {
            plateau: parties[partie].plateau,
            tour: parties[partie].tour
        });
    });

    socket.on('jouer', ({ partie, x, y }) => {
        const p = parties[partie];
        if (!p) return;

        const joueur = p.joueurs[socket.id];
        const couleur = joueur === 'Mone' ? 'red' : 'purple';
        const adv = joueur === 'Mone' ? 'purple' : 'red';

        if (p.tour !== joueur || p.plateau[y][x] !== '') return;

        if (jouerCoup(p.plateau, x, y, couleur, adv)) {
            p.tour = p.tour === 'Mone' ? 'May.C' : 'Mone';
            io.to(partie).emit('maj', {
                plateau: p.plateau,
                tour: p.tour
            });
        }
    });

    socket.on('rejouer', (partie) => {
        if (parties[partie]) {
            parties[partie].plateau = initPlateau();
            parties[partie].tour = 'Mone';
            io.to(partie).emit('maj', {
                plateau: parties[partie].plateau,
                tour: parties[partie].tour
            });
        }
    });
});

function initPlateau() {
    const size = 8;
    const plateau = Array.from({ length: size }, () => Array(size).fill(''));
    plateau[3][3] = 'purple';
    plateau[3][4] = 'red';
    plateau[4][3] = 'red';
    plateau[4][4] = 'purple';
    return plateau;
}

function jouerCoup(plateau, x, y, couleur, adv) {
    const directions = [
        [0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]
    ];
    let valid = false;

    for (const [dx, dy] of directions) {
        let nx = x + dx, ny = y + dy;
        let pieces = [];

        while (nx >= 0 && ny >= 0 && nx < 8 && ny < 8 && plateau[ny][nx] === adv) {
            pieces.push([nx, ny]);
            nx += dx;
            ny += dy;
        }

        if (pieces.length > 0 && nx >= 0 && ny >= 0 && nx < 8 && ny < 8 && plateau[ny][nx] === couleur) {
            for (const [px, py] of pieces) {
                plateau[py][px] = couleur;
            }
            plateau[y][x] = couleur;
            valid = true;
        }
    }

    return valid;
}

http.listen(3000, () => console.log('Serveur démarré sur http://localhost:3000'));