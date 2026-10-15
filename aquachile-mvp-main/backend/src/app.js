const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/catalogos', require('./routes/catalogos'));
app.use('/api/candidatos', require('./routes/candidatos'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
