// RF01 – ingreso simple con usuarios ficticios (roles simulados)
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import FormField from "../components/SolicitudEvaluacionForm/FormField";
import { useAuth } from "../context/AuthContext";
import "../components/SolicitudEvaluacionForm/SolicitudEvaluacionForm.css";

const DEMO = [
  ["Administrador", "admin@aquachile.test"],
  ["Analista", "analista@aquachile.test"],
  ["Evaluador", "evaluador1@aquachile.test"],
  ["Jefatura", "jefatura@aquachile.test"],
];

export default function LoginPage() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "demo1234" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) return setError("Ingrese correo y contraseña.");
    setCargando(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="solicitud-form-container">
      <form className="solicitud-form" onSubmit={onSubmit} noValidate>
        <h1 className="solicitud-form__title">Ingreso al sistema</h1>
        <p className="solicitud-form__subtitle">MVP académico · datos ficticios</p>
        {error && <div className="alert alert--error">{error}</div>}
        <FormField label="Correo" name="email" type="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <FormField label="Contraseña" name="password" type="password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="solicitud-form__submit" disabled={cargando}>
          {cargando ? "Ingresando…" : "Ingresar"}
        </button>
        <p className="login-demo">
          Usuarios de prueba (clave <code>demo1234</code>):
          <br />
          {DEMO.map(([rol, email]) => (
            <button type="button" key={email} className="btn btn--link"
              onClick={() => setForm({ email, password: "demo1234" })}>
              {rol}
            </button>
          ))}
        </p>
      </form>
    </div>
  );
}
