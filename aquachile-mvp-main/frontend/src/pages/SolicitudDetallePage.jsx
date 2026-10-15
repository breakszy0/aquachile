// RF06 (detalle) + RF08 (estado) + RF09 (evaluación)
import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FormField from "../components/SolicitudEvaluacionForm/FormField";
import EstadoBadge from "../components/EstadoBadge";
import { api, ApiError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { validarFormularioEvaluacion, formularioTieneErrores } from "../utils/validaciones";

const SIGUIENTE = { Pendiente: "En proceso", "En proceso": "Finalizada" };

export default function SolicitudDetallePage() {
  const { id } = useParams();
  const { can } = useAuth();
  const [s, setS] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [ev, setEv] = useState({ fecha_evaluacion: "", resultado: "", observaciones: "" });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const cargar = useCallback(async () => {
    try {
      const sol = await api.solicitudes.obtener(id);
      setS(sol);
      if (sol.evaluacion) {
        setEv({
          fecha_evaluacion: sol.evaluacion.fecha_evaluacion,
          resultado: sol.evaluacion.resultado || "",
          observaciones: sol.evaluacion.observaciones,
        });
      }
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    cargar();
    api.catalogos().then((c) => setResultados(c.resultados)).catch(() => {});
  }, [cargar]);

  async function avanzarEstado() {
    setError(""); setOk("");
    try {
      await api.solicitudes.cambiarEstado(id, SIGUIENTE[s.estado]);
      setOk("Estado actualizado.");
      await cargar();
    } catch (e) {
      setError(e.message); // p. ej. "Registra la evaluación antes de finalizar"
    }
  }

  async function guardarEvaluacion(e) {
    e.preventDefault();
    setError(""); setOk("");
    const nuevos = validarFormularioEvaluacion(ev);
    setErrores(nuevos);
    if (formularioTieneErrores(nuevos)) return;
    try {
      await api.solicitudes.guardarEvaluacion(id, ev);
      setOk("Evaluación guardada.");
      await cargar();
    } catch (err) {
      if (err instanceof ApiError) setErrores((p) => ({ ...p, ...err.detalles }));
      setError(err.message);
    }
  }

  const cambiarEv = (e) => {
    setEv({ ...ev, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: null });
  };

  if (!s) return error ? <div className="alert alert--error">{error}</div> : <p>Cargando…</p>;

  const finalizada = s.estado === "Finalizada";

  return (
    <>
      <Link to="/solicitudes">← Volver al listado</Link>
      <div className="page__head">
        <h1 className="page__title">Solicitud #{s.id}</h1>
        <EstadoBadge estado={s.estado} />
      </div>
      {error && <div className="alert alert--error">{error}</div>}
      {ok && <div className="alert alert--ok">{ok}</div>}

      <div className="two-col">
        <section className="panel">
          <h2>Datos de la solicitud</h2>
          <dl className="dl">
            <dt>Candidato</dt><dd>{s.candidato_nombre} ({s.candidato_correo})</dd>
            <dt>Cargo</dt><dd>{s.cargo}</dd>
            <dt>Familia de cargo</dt><dd>{s.familia_cargo}</dd>
            <dt>Fecha de solicitud</dt><dd>{s.fecha_solicitud}</dd>
            <dt>Responsable</dt><dd>{s.responsable_nombre}</dd>
            <dt>Observaciones</dt><dd>{s.observaciones || "—"}</dd>
          </dl>
          {can("actualizarEstado") && !finalizada && (
            <button className="btn" onClick={avanzarEstado}>
              Pasar a «{SIGUIENTE[s.estado]}»
            </button>
          )}
        </section>

        <section className="panel">
          <h2>Historial de estados</h2>
          <ul className="plain-list">
            {s.historial.map((h, i) => (
              <li key={i}>
                <span>{h.estado_anterior ? `${h.estado_anterior} → ` : ""}{h.estado_nuevo}</span>
                <small>{h.usuario} · {h.fecha}</small>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>Evaluación</h2>
        {can("registrarEvaluacion") && !finalizada ? (
          <form onSubmit={guardarEvaluacion} noValidate className="eval-form">
            <FormField label="Fecha de evaluación" name="fecha_evaluacion" type="date"
              value={ev.fecha_evaluacion} onChange={cambiarEv} error={errores.fecha_evaluacion} />
            <FormField label="Resultado general" name="resultado" as="select" value={ev.resultado}
              onChange={cambiarEv} error={errores.resultado} options={resultados} />
            <FormField label="Observaciones" name="observaciones" as="textarea" rows={4}
              value={ev.observaciones} onChange={cambiarEv} error={errores.observaciones} />
            <button className="btn">Guardar evaluación</button>
          </form>
        ) : s.evaluacion ? (
          <dl className="dl">
            <dt>Fecha</dt><dd>{s.evaluacion.fecha_evaluacion}</dd>
            <dt>Resultado</dt><dd>{s.evaluacion.resultado}</dd>
            <dt>Observaciones</dt><dd>{s.evaluacion.observaciones}</dd>
          </dl>
        ) : (
          <p className="empty">Aún no hay evaluación registrada.</p>
        )}
      </section>
    </>
  );
}
