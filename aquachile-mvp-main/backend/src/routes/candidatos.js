const router = require('express').Router();
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { badRequest, familiaExiste } = require('../utils');

router.use(authRequired);

const BASE = `
  SELECT c.*, f.nombre AS familia_cargo
  FROM candidatos c JOIN familias_cargo f ON f.id = c.familia_cargo_id`;

function validar(b = {}) {
  const e = {};
  if (!b.nombre || b.nombre.trim().length < 3) e.nombre = 'Ingresa el nombre (mínimo 3 caracteres)';
  if (!b.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.correo)) e.correo = 'Ingresa un correo válido';
  if (!b.telefono || !/^\+?[0-9\s-]{8,15}$/.test(b.telefono)) e.telefono = 'Teléfono inválido (8 a 15 dígitos)';
  if (!b.cargo || b.cargo.trim().length < 2) e.cargo = 'El cargo es obligatorio';
  if (!b.familia_cargo_id || !familiaExiste(b.familia_cargo_id)) e.familia_cargo_id = 'Selecciona una familia de cargo válida';
  return e;
}

// RF03 – consultar (con búsqueda simple)
router.get('/', (req, res) => {
  const { q, familia_cargo_id } = req.query;
  const where = [];
  const params = [];
  if (q) { where.push('(c.nombre LIKE ? OR c.correo LIKE ? OR c.cargo LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (familia_cargo_id) { where.push('c.familia_cargo_id = ?'); params.push(familia_cargo_id); }
  const sql = `${BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY c.id DESC`;
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const c = db.prepare(`${BASE} WHERE c.id = ?`).get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Candidato no encontrado' });
  c.solicitudes = db.prepare(
    'SELECT id, cargo, fecha_solicitud, estado FROM solicitudes WHERE candidato_id = ? ORDER BY id DESC'
  ).all(c.id);
  res.json(c);
});

// RF02 – registrar
router.post('/', requireRole('admin', 'analista'), (req, res) => {
  const e = validar(req.body);
  if (Object.keys(e).length) return badRequest(res, e);
  const b = req.body;
  const r = db.prepare(
    'INSERT INTO candidatos (nombre,correo,telefono,cargo,familia_cargo_id) VALUES (?,?,?,?,?)'
  ).run(b.nombre.trim(), b.correo.trim().toLowerCase(), b.telefono.trim(), b.cargo.trim(), b.familia_cargo_id);
  res.status(201).json(db.prepare(`${BASE} WHERE c.id = ?`).get(r.lastInsertRowid));
});

// RF03 – editar
router.put('/:id', requireRole('admin', 'analista'), (req, res) => {
  if (!db.prepare('SELECT 1 FROM candidatos WHERE id = ?').get(req.params.id)) {
    return res.status(404).json({ error: 'Candidato no encontrado' });
  }
  const e = validar(req.body);
  if (Object.keys(e).length) return badRequest(res, e);
  const b = req.body;
  db.prepare(`UPDATE candidatos SET nombre=?, correo=?, telefono=?, cargo=?, familia_cargo_id=?,
              updated_at=datetime('now') WHERE id=?`)
    .run(b.nombre.trim(), b.correo.trim().toLowerCase(), b.telefono.trim(), b.cargo.trim(), b.familia_cargo_id, req.params.id);
  res.json(db.prepare(`${BASE} WHERE c.id = ?`).get(req.params.id));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const tiene = db.prepare('SELECT 1 FROM solicitudes WHERE candidato_id = ?').get(req.params.id);
  if (tiene) return res.status(409).json({ error: 'No se puede eliminar: el candidato tiene solicitudes' });
  const r = db.prepare('DELETE FROM candidatos WHERE id = ?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Candidato no encontrado' });
  res.status(204).end();
});

module.exports = router;
