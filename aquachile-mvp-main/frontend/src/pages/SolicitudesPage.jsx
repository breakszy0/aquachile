// RF06 + RF07 – listado de solicitudes con filtros
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import EstadoBadge from "../components/EstadoBadge";

const FILTROS_VACIOS = { estado: "", cargo: "", candidato: "", fecha_desde: "", fecha_hasta: "" };

export default function SolicitudesPage() {
  const { can } = useAuth();
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [lista, setLista] = useState([]);
  const [estados, setEstados] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.catalogos().then((c) => setEstados(c.estados)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.solicitudes.listar(filtros).then(setLista).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [filtros]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">Solicitudes de evaluación</h1>
        {can("crearSolicitud") && <Link className="btn" to="/solicitudes/nueva">+ Nueva solicitud</Link>}
      </div>

      <div className="filters">
        <select name="estado" className="form-field__input" value={filtros.estado} onChange={cambiar}>
          <option value="">Todos los estados</option>
          {estados.map((e) => <option key={e}>{e}</option>)}
        </select>
        <input name="candidato" className="form-field__input" placeholder="Candidato" value={filtros.candidato} onChange={cambiar} />
        <input name="cargo" className="form-field__input" placeholder="Cargo" value={filtros.cargo} onChange={cambiar} />
        <input name="fecha_desde" type="date" className="form-field__input" title="Desde" value={filtros.fecha_desde} onChange={cambiar} />
        <input name="fecha_hasta" type="date" className="form-field__input" title="Hasta" value={filtros.fecha_hasta} onChange={cambiar} />
        <button className="btn btn--ghost" onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar</button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>N°</th><th>Candidato</th><th>Cargo</th><th>Familia</th><th>Fecha</th><th>Responsable</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {lista.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td><td>{s.candidato_nombre}</td><td>{s.cargo}</td><td>{s.familia_cargo}</td>
                <td>{s.fecha_solicitud}</td><td>{s.responsable_nombre}</td>
                <td><EstadoBadge estado={s.estado} /></td>
                <td><Link to={`/solicitudes/${s.id}`}>Ver detalle</Link></td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={8} className="empty">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
