export default function AedsFieldRenderer({ field, register, errors, watch }) {
  const name = field.name
  const error = errors?.[name]?.message
  const span = field.span || 4

  const common = {
    id: name,
    placeholder: field.placeholder || "",
    ...register(name),
  }

  return (
    <div className={`aeds-field span-${span}`}>
      <label htmlFor={name}>
        <span>{field.label}</span>
        {field.required && <em>*</em>}
      </label>

      {field.type === "select" ? (
        <select {...common}>
          <option value="">Select {field.label}</option>
          {(field.options || []).map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea {...common} />
      ) : field.type === "readonly" ? (
        <input value={watch(name) || field.value || ""} readOnly />
      ) : (
        <input type={field.type || "text"} {...common} />
      )}

      {field.help && !error && <small className="text-xs font-semibold text-slate-400">{field.help}</small>}
      {error && <div className="aeds-field-error">{error}</div>}
    </div>
  )
}
