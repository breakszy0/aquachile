const router = require('express').Router();
const db = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// RF10 – indicadores (todos los roles pueden consultarlo, incluida Jefatura)
router.get('/', (req, res) => {
  const count = (sql, ...p) => db.prepare(sql).get(...p).n;
  res.json({
    total_candidatos: count('SELECT COUNT(*) AS n FROM candidatos'),
    total_solicitudes: count('SELECT COUNT(*) AS n FROM solicitudes'),
    pendientes: count("SELECT COUNT(*) AS n FROM solicitudes WHERE estado='Pendiente'"),
    en_proceso: count("SELECT COUNT(*) AS n FROM solicitudes WHERE estado='En proceso'"),
    finalizadas: count("SELECT COUNT(*) AS n FROM solicitudes WHERE estado='Finalizada'"),
    por_familia: db.prepare(`
      SELECT f.nombre AS familia_cargo, COUNT(s.id) AS total
      FROM familias_cargo f LEFT JOIN solicitudes s ON s.familia_cargo_id = f.id
      GROUP BY f.id ORDER BY total DESC`).all(),
    ultimas_solicitudes: db.prepare(`
      SELECT s.id, c.nombre AS candidato_nombre, s.cargo, s.estado, s.fecha_solicitud
      FROM solicitudes s JOIN candidatos c ON c.id = s.candidato_id
      ORDER BY s.id DESC LIMIT 5`).all(),
  });
});

// Vista del profesor: TODOS los postulantes con el estado de su última solicitud.
// Incluye a los candidatos que aún no tienen solicitud ("Sin solicitud").
router.get('/postulantes', (req, res) => {
  const { q, estado, familia_cargo_id } = req.query;
  const where = [];
  const p = [];
  if (q) { where.push('(c.nombre LIKE ? OR c.correo LIKE ? OR c.cargo LIKE ?)'); p.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (estado === 'Sin solicitud') where.push('s.id IS NULL');
  else if (estado) { where.push('s.estado = ?'); p.push(estado); }
  if (familia_cargo_id) { where.push('c.familia_cargo_id = ?'); p.push(familia_cargo_id); }
  // Coherente con /solicitudes: el evaluador solo ve a quienes tiene asignados
  if (req.user.rol === 'evaluador') { where.push('s.responsable_id = ?'); p.push(req.user.id); }

  const sql = `
    SELECT c.id, c.nombre, c.correo, c.telefono, c.cargo, f.nombre AS familia_cargo,
           s.id AS solicitud_id, s.estado, s.fecha_solicitud,
           u.nombre AS responsable_nombre, e.resultado,
           (SELECT COUNT(*) FROM solicitudes x WHERE x.candidato_id = c.id) AS total_solicitudes
    FROM candidatos c
    JOIN familias_cargo f ON f.id = c.familia_cargo_id
    LEFT JOIN solicitudes s ON s.id = (SELECT MAX(id) FROM solicitudes WHERE candidato_id = c.id)
    LEFT JOIN usuarios u ON u.id = s.responsable_id
    LEFT JOIN evaluaciones e ON e.solicitud_id = s.id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY c.id DESC`;
  res.json(db.prepare(sql).all(...p));
});

module.exports = router;
