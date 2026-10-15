// RF03 – listado y búsqueda de candidatos
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function CandidatosPage() {
  const { can } = useAuth();
  const [q, setQ] = useState("");
  const [lista, setLista] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api.candidatos.listar({ q }).then(setLista).catch((e) => setError(e.message));
    }, 250); // espera a que el usuario termine de escribir
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">Candidatos</h1>
        {can("crearCandidato") && <Link className="btn" to="/candidatos/nuevo">+ Nuevo candidato</Link>}
      </div>
      <input className="form-field__input search" placeholder="Buscar por nombre, correo o cargo…"
        value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <div className="alert alert--error">{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Cargo</th><th>Familia</th><th></th></tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td><td>{c.correo}</td><td>{c.telefono}</td>
                <td>{c.cargo}</td><td>{c.familia_cargo}</td>
                <td>{can("crearCandidato") && <Link to={`/candidatos/${c.id}/editar`}>Editar</Link>}</td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={6} className="empty">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
