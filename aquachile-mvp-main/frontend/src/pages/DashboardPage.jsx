// RF10 – Dashboard: indicadores + listado de TODOS los postulantes
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import EstadoBadge from "../components/EstadoBadge";

const FILTROS_VACIOS = { q: "", estado: "", familia_cargo_id: "" };

export default function DashboardPage() {
  const [d, setD] = useState(null);
  const [postulantes, setPostulantes] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setD).catch((e) => setError(e.message));
    api.catalogos().then((c) => setFamilias(c.familias_cargo)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.postulantes(filtros).then(setPostulantes).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [filtros]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const filtrarPorEstado = (estado) => setFiltros({ ...filtros, estado: filtros.estado === estado ? "" : estado });

  if (error && !d) return <div className="alert alert--error">{error}</div>;
  if (!d) return <p>Cargando…</p>;

  // Las tarjetas también funcionan como filtro rápido del listado
  const tarjetas = [
    ["Total candidatos", d.total_candidatos, "", ""],
    ["Pendientes", d.pendientes, "card--pendiente", "Pendiente"],
    ["En proceso", d.en_proceso, "card--proceso", "En proceso"],
    ["Finalizadas", d.finalizadas, "card--final", "Finalizada"],
  ];

  return (
    <>
      <h1 className="page__title">Dashboard</h1>
      <div className="cards">
        {tarjetas.map(([titulo, n, clase, estado]) => (
          <div
            key={titulo}
            className={`card ${clase} ${estado ? "card--click" : ""} ${estado && filtros.estado === estado ? "card--activa" : ""}`}
            onClick={estado ? () => filtrarPorEstado(estado) : undefined}
            title={estado ? "Clic para filtrar la tabla" : undefined}
          >
            <span className="card__number">{n}</span>
            <span className="card__label">{titulo}</span>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="page__head">
          <h2>Postulantes ({postulantes.length})</h2>
        </div>
        <div className="filters">
          <input name="q" className="form-field__input" placeholder="Buscar nombre, correo o cargo…"
            value={filtros.q} onChange={cambiar} />
          <select name="estado" className="form-field__input" value={filtros.estado} onChange={cambiar}>
            <option value="">Todos los estados</option>
            <option>Pendiente</option>
            <option>En proceso</option>
            <option>Finalizada</option>
            <option>Sin solicitud</option>
          </select>
          <select name="familia_cargo_id" className="form-field__input" value={filtros.familia_cargo_id} onChange={cambiar}>
            <option value="">Todas las familias</option>
            {familias.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
          <button className="btn btn--ghost" onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar</button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Postulante</th><th>Contacto</th><th>Cargo</th><th>Familia</th>
                <th>Fecha solicitud</th><th>Evaluador</th><th>Estado</th><th>Resultado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {postulantes.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.nombre}</strong></td>
                  <td>{p.correo}<br /><small>{p.telefono}</small></td>
                  <td>{p.cargo}</td>
                  <td>{p.familia_cargo}</td>
                  <td>{p.fecha_solicitud || "—"}</td>
                  <td>{p.responsable_nombre || "—"}</td>
                  <td>{p.estado ? <EstadoBadge estado={p.estado} /> : <span className="badge badge--sin">Sin solicitud</span>}</td>
                  <td>{p.resultado || "—"}</td>
                  <td>{p.solicitud_id && <Link to={`/solicitudes/${p.solicitud_id}`}>Ver detalle</Link>}</td>
                </tr>
              ))}
              {postulantes.length === 0 && <tr><td colSpan={9} className="empty">Sin postulantes con estos filtros</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <h2>Solicitudes por familia de cargo</h2>
          <ul className="plain-list">
            {d.por_familia.map((f) => (
              <li key={f.familia_cargo}><span>{f.familia_cargo}</span><strong>{f.total}</strong></li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Últimas solicitudes</h2>
          <ul className="plain-list">
            {d.ultimas_solicitudes.map((s) => (
              <li key={s.id}>
                <Link to={`/solicitudes/${s.id}`}>{s.candidato_nombre} – {s.cargo}</Link>
                <EstadoBadge estado={s.estado} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
