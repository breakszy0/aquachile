const router = require('express').Router();
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { ESTADOS, RESULTADOS, esFecha, hoy, badRequest, familiaExiste, esEvaluador } = require('../utils');

router.use(authRequired);

const BASE = `
  SELECT s.*, c.nombre AS candidato_nombre, c.correo AS candidato_correo,
         f.nombre AS familia_cargo, u.nombre AS responsable_nombre
  FROM solicitudes s
  JOIN candidatos c ON c.id = s.candidato_id
  JOIN familias_cargo f ON f.id = s.familia_cargo_id
  JOIN usuarios u ON u.id = s.responsable_id`;

// El evaluador solo ve / modifica las solicitudes que tiene asignadas
function puedeAcceder(user, solicitud) {
  return user.rol !== 'evaluador' || solicitud.responsable_id === user.id;
}

function cargarSolicitud(req, res) {
  const s = db.prepare(`${BASE} WHERE s.id = ?`).get(req.params.id);
  if (!s) { res.status(404).json({ error: 'Solicitud no encontrada' }); return null; }
  if (!puedeAcceder(req.user, s)) { res.status(403).json({ error: 'Esta solicitud no está asignada a ti' }); return null; }
  return s;
}

function cambiarEstado(solicitud, nuevo, usuarioId) {
  db.prepare("UPDATE solicitudes SET estado=?, updated_at=datetime('now') WHERE id=?").run(nuevo, solicitud.id);
  db.prepare('INSERT INTO historial_estados (solicitud_id,estado_anterior,estado_nuevo,usuario_id) VALUES (?,?,?,?)')
    .run(solicitud.id, solicitud.estado, nuevo, usuarioId);
}

// RF06 + RF07 – listado con filtros
router.get('/', (req, res) => {
  const { estado, cargo, candidato, fecha_desde, fecha_hasta, responsable_id } = req.query;
  const where = [];
  const p = [];
  if (estado) { where.push('s.estado = ?'); p.push(estado); }
  if (cargo) { where.push('s.cargo LIKE ?'); p.push(`%${cargo}%`); }
  if (candidato) { where.push('c.nombre LIKE ?'); p.push(`%${candidato}%`); }
  if (fecha_desde) { where.push('s.fecha_solicitud >= ?'); p.push(fecha_desde); }
  if (fecha_hasta) { where.push('s.fecha_solicitud <= ?'); p.push(fecha_hasta); }
  if (responsable_id) { where.push('s.responsable_id = ?'); p.push(responsable_id); }
  if (req.user.rol === 'evaluador') { where.push('s.responsable_id = ?'); p.push(req.user.id); }
  const sql = `${BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY s.fecha_solicitud DESC, s.id DESC`;
  res.json(db.prepare(sql).all(...p));
});

// RF06 – detalle (incluye evaluación e historial de estados)
router.get('/:id', (req, res) => {
  const s = cargarSolicitud(req, res);
  if (!s) return;
  s.evaluacion = db.prepare('SELECT * FROM evaluaciones WHERE solicitud_id = ?').get(s.id) || null;
  s.historial = db.prepare(`
    SELECT h.estado_anterior, h.estado_nuevo, h.fecha, u.nombre AS usuario
    FROM historial_estados h JOIN usuarios u ON u.id = h.usuario_id
    WHERE h.solicitud_id = ? ORDER BY h.id`).all(s.id);
  res.json(s);
});

function validarSolicitud(b = {}) {
  const e = {};
  if (!b.candidato_id || !db.prepare('SELECT 1 FROM candidatos WHERE id=?').get(b.candidato_id)) e.candidato_id = 'Selecciona un candidato válido';
  if (!b.cargo || b.cargo.trim().length < 2) e.cargo = 'El cargo es obligatorio';
  if (!b.familia_cargo_id || !familiaExiste(b.familia_cargo_id)) e.familia_cargo_id = 'Selecciona una familia de cargo válida';
  if (b.fecha_solicitud && !esFecha(b.fecha_solicitud)) e.fecha_solicitud = 'Fecha inválida (AAAA-MM-DD)';
  if (!b.responsable_id || !esEvaluador(b.responsable_id)) e.responsable_id = 'Selecciona un evaluador responsable';
  return e;
}

// RF04 + RF05 – crear solicitud
router.post('/', requireRole('admin', 'analista'), (req, res) => {
  const e = validarSolicitud(req.body);
  if (Object.keys(e).length) return badRequest(res, e);
  const b = req.body;
  const r = db.prepare(`INSERT INTO solicitudes
    (candidato_id,cargo,familia_cargo_id,fecha_solicitud,estado,responsable_id,creado_por,observaciones)
    VALUES (?,?,?,?,'Pendiente',?,?,?)`)
    .run(b.candidato_id, b.cargo.trim(), b.familia_cargo_id, b.fecha_solicitud || hoy(),
         b.responsable_id, req.user.id, b.observaciones || null);
  db.prepare('INSERT INTO historial_estados (solicitud_id,estado_anterior,estado_nuevo,usuario_id) VALUES (?,?,?,?)')
    .run(r.lastInsertRowid, null, 'Pendiente', req.user.id);
  res.status(201).json(db.prepare(`${BASE} WHERE s.id = ?`).get(r.lastInsertRowid));
});

// Editar datos de la solicitud (no el estado)
router.put('/:id', requireRole('admin', 'analista'), (req, res) => {
  const s = cargarSolicitud(req, res);
  if (!s) return;
  const e = validarSolicitud(req.body);
  if (Object.keys(e).length) return badRequest(res, e);
  const b = req.body;
  db.prepare(`UPDATE solicitudes SET candidato_id=?, cargo=?, familia_cargo_id=?, fecha_solicitud=?,
              responsable_id=?, observaciones=?, updated_at=datetime('now') WHERE id=?`)
    .run(b.candidato_id, b.cargo.trim(), b.familia_cargo_id, b.fecha_solicitud || s.fecha_solicitud,
         b.responsable_id, b.observaciones || null, s.id);
  res.json(db.prepare(`${BASE} WHERE s.id = ?`).get(s.id));
});

// RF08 – actualizar estado (Pendiente → En proceso → Finalizada)
router.patch('/:id/estado', requireRole('admin', 'evaluador'), (req, res) => {
  const s = cargarSolicitud(req, res);
  if (!s) return;
  const nuevo = req.body && req.body.estado;
  if (!ESTADOS.includes(nuevo)) return badRequest(res, { estado: `Estado inválido. Usa: ${ESTADOS.join(', ')}` });
  if (nuevo === s.estado) return res.json(s);

  const idx = (x) => ESTADOS.indexOf(x);
  if (idx(nuevo) < idx(s.estado)) {
    return res.status(409).json({ error: `No se puede volver de "${s.estado}" a "${nuevo}"` });
  }
  if (nuevo === 'Finalizada') {
    const ev = db.prepare('SELECT 1 FROM evaluaciones WHERE solicitud_id = ?').get(s.id);
    if (!ev) return res.status(409).json({ error: 'Registra la evaluación antes de finalizar la solicitud' });
  }
  cambiarEstado(s, nuevo, req.user.id);
  res.json(db.prepare(`${BASE} WHERE s.id = ?`).get(s.id));
});

// RF09 – registrar / actualizar evaluación (una por solicitud)
router.put('/:id/evaluacion', requireRole('admin', 'evaluador'), (req, res) => {
  const s = cargarSolicitud(req, res);
  if (!s) return;
  const b = req.body || {};
  const e = {};
  if (!esFecha(b.fecha_evaluacion)) e.fecha_evaluacion = 'Fecha inválida (AAAA-MM-DD)';
  if (!b.observaciones || b.observaciones.trim().length < 5) e.observaciones = 'Escribe observaciones (mínimo 5 caracteres)';
  if (!RESULTADOS.includes(b.resultado)) e.resultado = `Resultado inválido. Usa: ${RESULTADOS.join(', ')}`;
  if (Object.keys(e).length) return badRequest(res, e);

  const existe = db.prepare('SELECT id FROM evaluaciones WHERE solicitud_id = ?').get(s.id);
  if (existe) {
    db.prepare(`UPDATE evaluaciones SET fecha_evaluacion=?, observaciones=?, resultado=?,
                updated_at=datetime('now') WHERE solicitud_id=?`)
      .run(b.fecha_evaluacion, b.observaciones.trim(), b.resultado, s.id);
  } else {
    db.prepare('INSERT INTO evaluaciones (solicitud_id,fecha_evaluacion,observaciones,resultado) VALUES (?,?,?,?)')
      .run(s.id, b.fecha_evaluacion, b.observaciones.trim(), b.resultado);
  }
  // Al registrar evaluación, una solicitud Pendiente pasa a En proceso automáticamente
  if (s.estado === 'Pendiente') cambiarEstado(s, 'En proceso', req.user.id);

  res.status(existe ? 200 : 201).json(db.prepare('SELECT * FROM evaluaciones WHERE solicitud_id = ?').get(s.id));
});

module.exports = router;
