PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('admin','analista','evaluador','jefatura')),
  activo        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS familias_cargo (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS candidatos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre           TEXT NOT NULL,
  correo           TEXT NOT NULL UNIQUE,
  telefono         TEXT NOT NULL,
  cargo            TEXT NOT NULL,
  familia_cargo_id INTEGER NOT NULL REFERENCES familias_cargo(id),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  candidato_id     INTEGER NOT NULL REFERENCES candidatos(id),
  cargo            TEXT NOT NULL,
  familia_cargo_id INTEGER NOT NULL REFERENCES familias_cargo(id),
  fecha_solicitud  TEXT NOT NULL,
  estado           TEXT NOT NULL DEFAULT 'Pendiente'
                   CHECK (estado IN ('Pendiente','En proceso','Finalizada')),
  responsable_id   INTEGER NOT NULL REFERENCES usuarios(id),
  creado_por       INTEGER NOT NULL REFERENCES usuarios(id),
  observaciones    TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evaluaciones (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id     INTEGER NOT NULL UNIQUE REFERENCES solicitudes(id) ON DELETE CASCADE,
  fecha_evaluacion TEXT NOT NULL,
  observaciones    TEXT NOT NULL,
  resultado        TEXT CHECK (resultado IN ('Recomendable','Recomendable con observaciones','No recomendable')),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Trazabilidad (mejora acotada): cada cambio de estado queda registrado
CREATE TABLE IF NOT EXISTS historial_estados (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id    INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo    TEXT NOT NULL,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
  fecha           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_candidato ON solicitudes(candidato_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_responsable ON solicitudes(responsable_id);
