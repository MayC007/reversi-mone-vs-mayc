const express = require("express");
const path = require("path");
const app = express();

// Sert le dossier "public" pour les fichiers HTML/CSS/JS
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur actif sur le port ${port}`);
});
