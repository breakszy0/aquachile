# Backend – MVP Evaluación Psicolaboral AquaChile (DSY1104)

Node.js + Express + SQLite (better-sqlite3). Todos los datos son ficticios.

## Puesta en marcha
```bash
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:4000  (crea la BD y carga datos ficticios la 1ª vez)
```

## Usuarios de prueba (password: `demo1234`)
| Rol | Correo |
|---|---|
| Administrador | admin@aquachile.test |
| Analista de Reclutamiento | analista@aquachile.test |
| Evaluador | evaluador1@aquachile.test / evaluador2@aquachile.test |
| Jefatura | jefatura@aquachile.test |

## Endpoints
| Método | Ruta | Roles | RF |
|---|---|---|---|
| POST | /api/auth/login | público | RF01 |
| GET | /api/auth/me | todos | RF01 |
| GET | /api/catalogos | todos | RF05 |
| GET | /api/candidatos?q=&familia_cargo_id= | todos | RF03 |
| GET | /api/candidatos/:id | todos | RF03 |
| POST | /api/candidatos | admin, analista | RF02 |
| PUT | /api/candidatos/:id | admin, analista | RF03 |
| DELETE | /api/candidatos/:id | admin | – |
| GET | /api/solicitudes?estado=&cargo=&candidato=&fecha_desde=&fecha_hasta=&responsable_id= | todos (evaluador: solo las suyas) | RF06, RF07 |
| GET | /api/solicitudes/:id | todos | RF06 |
| POST | /api/solicitudes | admin, analista | RF04, RF05 |
| PUT | /api/solicitudes/:id | admin, analista | RF05 |
| PATCH | /api/solicitudes/:id/estado | admin, evaluador | RF08 |
| PUT | /api/solicitudes/:id/evaluacion | admin, evaluador | RF09 |
| GET | /api/dashboard | todos | RF10 |
| GET | /api/dashboard/postulantes?q=&estado=&familia_cargo_id= | todos (evaluador: solo sus asignados) | RF10 (listado de todos los postulantes) |

## Reglas de negocio
- Estados: Pendiente → En proceso → Finalizada (no se retrocede).
- No se puede finalizar sin evaluación registrada.
- Registrar una evaluación sobre una solicitud Pendiente la pasa a En proceso.
- Cada cambio de estado queda en `historial_estados` (trazabilidad).
- Errores de validación: HTTP 400 con `{ error, detalles: { campo: mensaje } }`.

## Estructura
```
src/
  server.js  app.js  db.js  schema.sql  seed.js  utils.js
  middleware/  auth.js  errors.js
  routes/      auth  catalogos  candidatos  solicitudes  dashboard
```

## ¿Dónde se guardan los datos?
En un único archivo SQLite: `backend/data/aquachile.db` (se crea solo al iniciar el servidor).
Para verlo: instala **DB Browser for SQLite** (gratis) y abre ese archivo, o ejecuta
`node -e "console.table(require('better-sqlite3')('data/aquachile.db').prepare('SELECT * FROM solicitudes').all())"`.
Para reiniciar con datos de ejemplo: detén el servidor, borra `data/aquachile.db` y vuelve a iniciarlo.
