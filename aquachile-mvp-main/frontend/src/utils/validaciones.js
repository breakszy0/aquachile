// src/utils/validaciones.js

// Funciones puras de validación, independientes de React,
// para que puedan reutilizarse o testearse por separado.

const TIPOS_ARCHIVO_PERMITIDOS = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

export function validarNombreCandidato(nombre) {
  if (!nombre || nombre.trim() === "") {
    return "El nombre del candidato es obligatorio.";
  }
  const partes = nombre.trim().split(/\s+/);
  if (partes.length < 2) {
    return "Ingrese nombre y apellido del candidato.";
  }
  return null;
}

export function validarFamiliaCargo(familia) {
  if (!familia || familia.trim() === "") {
    return "Debe seleccionar una familia de cargo.";
  }
  return null;
}

export function validarNombreCargo(cargo) {
  if (!cargo || cargo.trim() === "") {
    return "El nombre del cargo es obligatorio.";
  }
  return null;
}

export function validarArchivoCV(archivo) {
  if (!archivo) {
    return "Debe adjuntar el Curriculum Vitae.";
  }
  if (!TIPOS_ARCHIVO_PERMITIDOS.includes(archivo.type)) {
    return "El archivo debe ser formato PDF, DOC o DOCX.";
  }
  return null;
}

export function validarFormulario(datos) {
  return {
    nombreCandidato: validarNombreCandidato(datos.nombreCandidato),
    familiaCargo: validarFamiliaCargo(datos.familiaCargo),
    nombreCargo: validarNombreCargo(datos.nombreCargo),
    cv: validarArchivoCV(datos.cv),
  };
}

export function formularioTieneErrores(errores) {
  return Object.values(errores).some((error) => error !== null);
}

// ---------- Validaciones agregadas para el MVP full stack ----------

export function validarCorreo(correo) {
  if (!correo || correo.trim() === "") return "El correo es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return "Ingrese un correo válido.";
  return null;
}

export function validarTelefono(telefono) {
  if (!telefono || telefono.trim() === "") return "El teléfono es obligatorio.";
  if (!/^\+?[0-9\s-]{8,15}$/.test(telefono.trim())) return "Teléfono inválido (8 a 15 dígitos).";
  return null;
}

export function validarSeleccion(valor, mensaje) {
  return !valor ? mensaje : null;
}

export function validarFechaObligatoria(fecha) {
  if (!fecha) return "La fecha es obligatoria.";
  return null;
}

export function validarTextoMin(texto, min, mensaje) {
  return !texto || texto.trim().length < min ? mensaje : null;
}

// RF02 / RF03
export function validarFormularioCandidato(d) {
  return {
    nombre: validarNombreCandidato(d.nombre),
    correo: validarCorreo(d.correo),
    telefono: validarTelefono(d.telefono),
    cargo: validarNombreCargo(d.cargo),
    familia_cargo_id: validarFamiliaCargo(String(d.familia_cargo_id || "")),
  };
}

// RF04 / RF05
export function validarFormularioSolicitud(d) {
  return {
    candidato_id: validarSeleccion(d.candidato_id, "Debe seleccionar un candidato."),
    cargo: validarNombreCargo(d.cargo),
    familia_cargo_id: validarFamiliaCargo(String(d.familia_cargo_id || "")),
    fecha_solicitud: validarFechaObligatoria(d.fecha_solicitud),
    responsable_id: validarSeleccion(d.responsable_id, "Debe seleccionar un evaluador responsable."),
  };
}

// RF09
export function validarFormularioEvaluacion(d) {
  return {
    fecha_evaluacion: validarFechaObligatoria(d.fecha_evaluacion),
    resultado: validarSeleccion(d.resultado, "Seleccione un resultado."),
    observaciones: validarTextoMin(d.observaciones, 5, "Escriba observaciones (mínimo 5 caracteres)."),
  };
}
