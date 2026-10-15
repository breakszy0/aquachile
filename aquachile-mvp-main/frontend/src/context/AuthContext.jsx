// src/context/AuthContext.jsx – RF01: sesión y permisos por rol
import React, { createContext, useContext, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const NOMBRES_ROL = {
  admin: "Administrador",
  analista: "Analista de Reclutamiento",
  evaluador: "Profesional Evaluador",
  jefatura: "Jefatura",
};

// Solo controla qué botones se muestran. La seguridad real está en el backend (403).
const PERMISOS = {
  admin: { crearCandidato: true, crearSolicitud: true, actualizarEstado: true, registrarEvaluacion: true },
  analista: { crearCandidato: true, crearSolicitud: true, actualizarEstado: false, registrarEvaluacion: false },
  evaluador: { crearCandidato: false, crearSolicitud: false, actualizarEstado: true, registrarEvaluacion: true },
  jefatura: { crearCandidato: false, crearSolicitud: false, actualizarEstado: false, registrarEvaluacion: false },
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem("usuario") || "null"));

  async function login(email, password) {
    const r = await api.login(email, password);
    localStorage.setItem("token", r.token);
    localStorage.setItem("usuario", JSON.stringify(r.usuario));
    setUsuario(r.usuario);
  }
  function logout() {
    localStorage.clear();
    setUsuario(null);
  }
  const can = (accion) => !!usuario && !!PERMISOS[usuario.rol]?.[accion];

  return <AuthContext.Provider value={{ usuario, login, logout, can }}>{children}</AuthContext.Provider>;
}
