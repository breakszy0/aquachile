const db = require('./db');

const ESTADOS = ['Pendiente', 'En proceso', 'Finalizada'];
const RESULTADOS = ['Recomendable', 'Recomendable con observaciones', 'No recomendable'];

const esFecha = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
const hoy = () => new Date().toISOString().slice(0, 10);

// Responde 400 con { error, detalles: { campo: mensaje } }
function badRequest(res, detalles) {
  return res.status(400).json({ error: 'Datos inválidos', detalles });
}

const familiaExiste = (id) => !!db.prepare('SELECT 1 FROM familias_cargo WHERE id = ?').get(id);
const esEvaluador = (id) =>
  !!db.prepare("SELECT 1 FROM usuarios WHERE id = ? AND rol = 'evaluador' AND activo = 1").get(id);

module.exports = { ESTADOS, RESULTADOS, esFecha, hoy, badRequest, familiaExiste, esEvaluador };
