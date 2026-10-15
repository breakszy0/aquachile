import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, NOMBRES_ROL } from "../context/AuthContext";
import "../App.css";

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function salir() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <header className="app-nav">
        <strong className="app-nav__brand">AquaChile · Evaluación Psicolaboral</strong>
        <nav className="app-nav__links">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/candidatos">Candidatos</NavLink>
          <NavLink to="/solicitudes">Solicitudes</NavLink>
        </nav>
        <span className="app-nav__user">
          {usuario.nombre} · {NOMBRES_ROL[usuario.rol]}
        </span>
        <button className="btn btn--ghost" onClick={salir}>Salir</button>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
