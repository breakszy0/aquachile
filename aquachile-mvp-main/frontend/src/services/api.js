// src/services/api.js – único punto donde el frontend habla con el backend
const BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(message, status, detalles) {
    super(message);
    this.status = status;
    this.detalles = detalles || {}; // { campo: "mensaje" } para pintar bajo cada input
  }
}

async function request(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. ¿Está corriendo el backend?", 0);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/auth/login") {
    localStorage.clear();
    window.location.href = "/login";
  }
  if (!res.ok) throw new ApiError(data.error || "Error inesperado", res.status, data.detalles);
  return data;
}

const qs = (obj = {}) => {
  const p = new URLSearchParams(Object.entries(obj).filter(([, v]) => v !== "" && v != null));
  return p.toString() ? `?${p}` : "";
};

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  catalogos: () => request("/catalogos"),
  dashboard: () => request("/dashboard"),
  postulantes: (f) => request(`/dashboard/postulantes${qs(f)}`),
  candidatos: {
    listar: (f) => request(`/candidatos${qs(f)}`),
    obtener: (id) => request(`/candidatos/${id}`),
    crear: (d) => request("/candidatos", { method: "POST", body: d }),
    editar: (id, d) => request(`/candidatos/${id}`, { method: "PUT", body: d }),
  },
  solicitudes: {
    listar: (f) => request(`/solicitudes${qs(f)}`),
    obtener: (id) => request(`/solicitudes/${id}`),
    crear: (d) => request("/solicitudes", { method: "POST", body: d }),
    cambiarEstado: (id, estado) => request(`/solicitudes/${id}/estado`, { method: "PATCH", body: { estado } }),
    guardarEvaluacion: (id, d) => request(`/solicitudes/${id}/evaluacion`, { method: "PUT", body: d }),
  },
};
