const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { firmarToken, authRequired } = require('../middleware/auth');

// RF01 – ingreso simple con usuarios ficticios
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: {
      ...(!email && { email: 'El correo es obligatorio' }),
      ...(!password && { password: 'La contraseña es obligatoria' }),
    } });
  }
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ? AND activo = 1').get(email);
  if (!u || !bcrypt.compareSync(password, u.password_hash)) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }
  res.json({
    token: firmarToken(u),
    usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol },
  });
});

router.get('/me', authRequired, (req, res) => res.json({ usuario: req.user }));

module.exports = router;
