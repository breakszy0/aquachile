const router = require('express').Router();
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { ESTADOS, RESULTADOS } = require('../utils');

router.use(authRequired);

// Catálogos para poblar <select> en el frontend
router.get('/', (req, res) => {
  res.json({
    familias_cargo: db.prepare('SELECT id, nombre FROM familias_cargo ORDER BY nombre').all(),
    evaluadores: db.prepare("SELECT id, nombre FROM usuarios WHERE rol='evaluador' AND activo=1 ORDER BY nombre").all(),
    estados: ESTADOS,
    resultados: RESULTADOS,
  });
});

module.exports = router;
