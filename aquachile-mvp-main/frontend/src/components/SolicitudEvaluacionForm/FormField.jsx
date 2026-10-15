// src/components/SolicitudEvaluacionForm/FormField.jsx
import React from "react";

// Componente reutilizable: input, select o textarea con su label y mensaje de error.
// "options" acepta strings ("Finanzas") u objetos ({ value: 3, label: "Ana Pérez" }).

const normalizar = (o) => (typeof o === "object" ? o : { value: o, label: o });

function FormField({
  label,
  name,
  as = "input",
  type = "text",
  value,
  onChange,
  error,
  options = [],
  placeholder,
  rows = 3,
  disabled = false,
}) {
  const clase = `form-field__input ${error ? "form-field__input--error" : ""}`;
  const comunes = { id: name, name, value, onChange, disabled, className: clase, "aria-invalid": !!error };

  return (
    <div className="form-field">
      <label htmlFor={name} className="form-field__label">
        {label}
      </label>

      {as === "select" ? (
        <select {...comunes}>
          <option value="">Seleccione una opción</option>
          {options.map(normalizar).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea {...comunes} rows={rows} placeholder={placeholder} />
      ) : (
        <input {...comunes} type={type} placeholder={placeholder} />
      )}

      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}

export default FormField;
