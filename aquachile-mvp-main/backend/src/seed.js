// Datos 100% FICTICIOS (el caso prohíbe datos reales).
const bcrypt = require('bcryptjs');
const db = require('./db');

function seed() {
  const hayUsuarios = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n;
  if (hayUsuarios > 0) return;

  const hash = bcrypt.hashSync('demo1234', 10);
  const insU = db.prepare('INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?)');
  insU.run('Admin Demo', 'admin@aquachile.test', hash, 'admin');
  insU.run('Ana Analista', 'analista@aquachile.test', hash, 'analista');
  insU.run('Elena Evaluadora', 'evaluador1@aquachile.test', hash, 'evaluador');
  insU.run('Esteban Evaluador', 'evaluador2@aquachile.test', hash, 'evaluador');
  insU.run('Julia Jefatura', 'jefatura@aquachile.test', hash, 'jefatura');

  const insF = db.prepare('INSERT INTO familias_cargo (nombre) VALUES (?)');
  ['Administración', 'Finanzas', 'Recursos Humanos', 'Operaciones', 'Tecnología', 'Comercial', 'Otra']
    .forEach((f) => insF.run(f));

  const insC = db.prepare(
    'INSERT INTO candidatos (nombre,correo,telefono,cargo,familia_cargo_id) VALUES (?,?,?,?,?)'
  );
  const candidatos = [
    ['Camila Rojas Prueba', 'camila.rojas@ejemplo.test', '+56 9 1111 0001', 'Operador de planta', 4],
    ['Diego Soto Ficticio', 'diego.soto@ejemplo.test', '+56 9 1111 0002', 'Supervisor de producción', 4],
    ['Valentina Muñoz Demo', 'valentina.munoz@ejemplo.test', '+56 9 1111 0003', 'Asistente administrativo', 1],
    ['Tomás Pérez Simulado', 'tomas.perez@ejemplo.test', '+56 9 1111 0004', 'Analista de finanzas', 2],
    ['Javiera Díaz Test', 'javiera.diaz@ejemplo.test', '+56 9 1111 0005', 'Ejecutiva comercial', 6],
  ];
  candidatos.forEach((c) => insC.run(...c));

  // solicitudes: [candidato, cargo, familia, fecha, estado, responsable, creado_por, obs]
  const insS = db.prepare(`INSERT INTO solicitudes
    (candidato_id,cargo,familia_cargo_id,fecha_solicitud,estado,responsable_id,creado_por,observaciones)
    VALUES (?,?,?,?,?,?,?,?)`);
  const insH = db.prepare(
    'INSERT INTO historial_estados (solicitud_id,estado_anterior,estado_nuevo,usuario_id) VALUES (?,?,?,?)'
  );
  const sols = [
    [1, 'Operador de planta', 4, '2026-09-01', 'Pendiente', 3, 2, 'Requiere evaluación urgente'],
    [2, 'Supervisor de producción', 4, '2026-09-03', 'En proceso', 3, 2, null],
    [3, 'Asistente administrativo', 1, '2026-09-05', 'Finalizada', 4, 2, null],
    [4, 'Analista de finanzas', 2, '2026-09-10', 'Pendiente', 4, 2, null],
  ];
  sols.forEach((s) => {
    const id = insS.run(...s).lastInsertRowid;
    insH.run(id, null, 'Pendiente', 2);
    if (s[4] !== 'Pendiente') insH.run(id, 'Pendiente', 'En proceso', s[5]);
    if (s[4] === 'Finalizada') insH.run(id, 'En proceso', 'Finalizada', s[5]);
  });

  db.prepare(`INSERT INTO evaluaciones (solicitud_id,fecha_evaluacion,observaciones,resultado)
              VALUES (3,'2026-09-08','Buen manejo de herramientas ofimáticas y comunicación clara.','Recomendable')`).run();

  console.log('[seed] Datos ficticios cargados. Password de todos los usuarios: demo1234');
}

module.exports = seed;
