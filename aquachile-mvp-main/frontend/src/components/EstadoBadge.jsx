import React from "react";

const CLASES = { Pendiente: "badge--pendiente", "En proceso": "badge--proceso", Finalizada: "badge--final" };

export default function EstadoBadge({ estado }) {
  return <span className={`badge ${CLASES[estado] || ""}`}>{estado}</span>;
}
