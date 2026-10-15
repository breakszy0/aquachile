require('dotenv').config();
const seed = require('./seed');
const app = require('./app');

seed(); // carga datos ficticios solo si la BD está vacía

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API AquaChile MVP escuchando en http://localhost:${PORT}`));
