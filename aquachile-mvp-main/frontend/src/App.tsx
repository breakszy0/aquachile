// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CandidatosPage from "./pages/CandidatosPage";
import CandidatoFormPage from "./pages/CandidatoFormPage";
import SolicitudesPage from "./pages/SolicitudesPage";
import SolicitudNuevaPage from "./pages/SolicitudNuevaPage";
import SolicitudDetallePage from "./pages/SolicitudDetallePage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/candidatos" element={<CandidatosPage />} />
            <Route path="/candidatos/nuevo" element={<CandidatoFormPage />} />
            <Route path="/candidatos/:id/editar" element={<CandidatoFormPage />} />
            <Route path="/solicitudes" element={<SolicitudesPage />} />
            <Route path="/solicitudes/nueva" element={<SolicitudNuevaPage />} />
            <Route path="/solicitudes/:id" element={<SolicitudDetallePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
