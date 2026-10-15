// src/components/SolicitudEvaluacionForm/SolicitudEvaluacionForm.jsx
// RF04 + RF05: crear una solicitud asociada a un candidato YA registrado.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "./FormField";
import { validarFormularioSolicitud, formularioTieneErrores } from "../../utils/validaciones";
import { api, ApiError } from "../../services/api";
import "./SolicitudEvaluacionForm.css";

const hoy = () => new Date().toISOString().slice(0, 10);

const ESTADO_INICIAL = {
  candidato_id: "",
  cargo: "",
  familia_cargo_id: "",
  fecha_solicitud: hoy(),
  responsable_id: "",
  observaciones: "",
};

function SolicitudEvaluacionForm() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [candidatos, setCandidatos] = useState([]);
  const [catalogos, setCatalogos] = useState({ familias_cargo: [], evaluadores: [] });

  useEffect(() => {
    Promise.all([api.candidatos.listar(), api.catalogos()])
      .then(([cands, cats]) => {
        setCandidatos(cands);
        setCatalogos(cats);
      })
      .catch((e) => setErrorGeneral(e.message));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setDatos((prev) => {
      const nuevo = { ...prev, [name]: value };
      // Al elegir candidato, se sugieren su cargo y familia (editables)
      if (name === "candidato_id") {
        const c = candidatos.find((x) => String(x.id) === value);
        if (c) {
          nuevo.cargo = c.cargo;
          nuevo.familia_cargo_id = String(c.familia_cargo_id);
        }
      }
      return nuevo;
    });
    setErrores((prev) => ({ ...prev, [name]: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nuevosErrores = validarFormularioSolicitud(datos);
    setErrores(nuevosErrores);
    if (formularioTieneErrores(nuevosErrores)) return;

    setGuardando(true);
    setErrorGeneral("");
    try {
      const creada = await api.solicitudes.crear({
        ...datos,
        candidato_id: Number(datos.candidato_id),
        familia_cargo_id: Number(datos.familia_cargo_id),
        responsable_id: Number(datos.responsable_id),
      });
      navigate(`/solicitudes/${creada.id}`);
    } catch (err) {
      if (err instanceof ApiError) setErrores((prev) => ({ ...prev, ...err.detalles }));
      setErrorGeneral(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="solicitud-form-container">
      <form className="solicitud-form" onSubmit={handleSubmit} noValidate>
        <h1 className="solicitud-form__title">Solicitud de Evaluación Psicolaboral</h1>
        <p className="solicitud-form__subtitle">
          Seleccione un candidato registrado y asigne un evaluador.
        </p>

        {errorGeneral && <div className="alert alert--error">{errorGeneral}</div>}

        <FormField
          label="Candidato"
          name="candidato_id"
          as="select"
          value={datos.candidato_id}
          onChange={handleChange}
          error={errores.candidato_id}
          options={candidatos.map((c) => ({ value: c.id, label: `${c.nombre} (${c.correo})` }))}
        />
        <FormField
          label="Familia de cargo"
          name="familia_cargo_id"
          as="select"
          value={datos.familia_cargo_id}
          onChange={handleChange}
          error={errores.familia_cargo_id}
          options={catalogos.familias_cargo.map((f) => ({ value: f.id, label: f.nombre }))}
        />
        <FormField
          label="Nombre del cargo"
          name="cargo"
          value={datos.cargo}
          onChange={handleChange}
          error={errores.cargo}
          placeholder="Ej: Analista de Recursos Humanos"
        />
        <FormField
          label="Fecha de solicitud"
          name="fecha_solicitud"
          type="date"
          value={datos.fecha_solicitud}
          onChange={handleChange}
          error={errores.fecha_solicitud}
        />
        <FormField
          label="Evaluador responsable"
          name="responsable_id"
          as="select"
          value={datos.responsable_id}
          onChange={handleChange}
          error={errores.responsable_id}
          options={catalogos.evaluadores.map((u) => ({ value: u.id, label: u.nombre }))}
        />
        <FormField
          label="Observaciones (opcional)"
          name="observaciones"
          as="textarea"
          value={datos.observaciones}
          onChange={handleChange}
          error={errores.observaciones}
        />

        <button type="submit" className="solicitud-form__submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Solicitar evaluación"}
        </button>
      </form>
    </div>
  );
}

export default SolicitudEvaluacionForm;
