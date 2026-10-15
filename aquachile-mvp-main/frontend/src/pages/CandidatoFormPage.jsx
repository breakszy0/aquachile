// RF02 (crear) y RF03 (editar) candidato
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormField from "../components/SolicitudEvaluacionForm/FormField";
import { validarFormularioCandidato, formularioTieneErrores } from "../utils/validaciones";
import { api, ApiError } from "../services/api";
import "../components/SolicitudEvaluacionForm/SolicitudEvaluacionForm.css";

const VACIO = { nombre: "", correo: "", telefono: "", cargo: "", familia_cargo_id: "" };

export default function CandidatoFormPage() {
  const { id } = useParams(); // si existe => edición
  const navigate = useNavigate();
  const [datos, setDatos] = useState(VACIO);
  const [familias, setFamilias] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.catalogos().then((c) => setFamilias(c.familias_cargo)).catch((e) => setErrorGeneral(e.message));
    if (id) {
      api.candidatos.obtener(id)
        .then((c) => setDatos({
          nombre: c.nombre, correo: c.correo, telefono: c.telefono,
          cargo: c.cargo, familia_cargo_id: String(c.familia_cargo_id),
        }))
        .catch((e) => setErrorGeneral(e.message));
    }
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setDatos((p) => ({ ...p, [name]: value }));
    setErrores((p) => ({ ...p, [name]: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nuevos = validarFormularioCandidato(datos);
    setErrores(nuevos);
    if (formularioTieneErrores(nuevos)) return;

    setGuardando(true);
    setErrorGeneral("");
    try {
      const payload = { ...datos, familia_cargo_id: Number(datos.familia_cargo_id) };
      if (id) await api.candidatos.editar(id, payload);
      else await api.candidatos.crear(payload);
      navigate("/candidatos");
    } catch (err) {
      if (err instanceof ApiError) setErrores((p) => ({ ...p, ...err.detalles }));
      setErrorGeneral(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="solicitud-form-container">
      <form className="solicitud-form" onSubmit={handleSubmit} noValidate>
        <h1 className="solicitud-form__title">{id ? "Editar candidato" : "Nuevo candidato"}</h1>
        <p className="solicitud-form__subtitle">Use datos ficticios.</p>
        {errorGeneral && <div className="alert alert--error">{errorGeneral}</div>}

        <FormField label="Nombre del candidato" name="nombre" value={datos.nombre}
          onChange={handleChange} error={errores.nombre} placeholder="Ej: Juan Pérez" />
        <FormField label="Correo" name="correo" type="email" value={datos.correo}
          onChange={handleChange} error={errores.correo} />
        <FormField label="Teléfono" name="telefono" type="tel" value={datos.telefono}
          onChange={handleChange} error={errores.telefono} placeholder="+56 9 1234 5678" />
        <FormField label="Cargo al que postula" name="cargo" value={datos.cargo}
          onChange={handleChange} error={errores.cargo} />
        <FormField label="Familia de cargo" name="familia_cargo_id" as="select" value={datos.familia_cargo_id}
          onChange={handleChange} error={errores.familia_cargo_id}
          options={familias.map((f) => ({ value: f.id, label: f.nombre }))} />

        <button className="solicitud-form__submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </div>
  );
}
